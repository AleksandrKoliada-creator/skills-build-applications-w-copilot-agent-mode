import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function validationError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFocus(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt:-1, _id: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const userId = asString(payload.userId);
  const teamId = asString(payload.teamId);
  const type = asString(payload.type);
  const minutesValue = Number(payload.minutes);

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw validationError('userId must be a valid ObjectId');
  }
  if (!teamId || !mongoose.isValidObjectId(teamId)) {
    throw validationError('teamId must be a valid ObjectId');
  }
  if (!type) {
    throw validationError('type is required');
  }
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw validationError('minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw validationError('User or team not found', 404);
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const name = asString(payload.name);
  const mascot = asString(payload.mascot);
  const members = Array.isArray(payload.members) ? payload.members : [];

  if (!name) {
    throw validationError('name is required');
  }
  if (!mascot) {
    throw validationError('mascot is required');
  }

  const normalizedMembers = members.map((member) => {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      throw validationError('members must contain valid ObjectId strings');
    }
    return new mongoose.Types.ObjectId(member);
  });

  const team = await Team.create({ name, mascot, members: normalizedMembers });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: Number(row.totalPoints),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = (userEmail ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw validationError('userEmail is required', 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw validationError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentFocus = recentActivities
    .map((activity) => normalizeFocus(String(activity.type)))
    .find(Boolean) ?? '';
  const preferredFocus = normalizeFocus(String(user.fitnessGoal)) || recentFocus;

  const workouts = await Workout.find().sort({ title: 1 }).lean();

  const suggestions = workouts
    .map((workout) => {
      const focus = normalizeFocus(String(workout.focus));
      const score = focus === preferredFocus ? 2 : focus === recentFocus ? 1 : 0;
      return { workout, score, focus };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout, focus }) => {
      const reason = focus === preferredFocus
        ? `Matches your ${preferredFocus || 'fitness'} goal and recent activity pattern.`
        : `Builds on your recent ${recentFocus || 'activity'} pattern.`;

      return {
        title: workout.title,
        focus,
        minutes: workout.minutes,
        difficulty: workout.difficulty,
        reason,
      };
    });

  return suggestions.length > 0 ? suggestions : [];
}

export { User };

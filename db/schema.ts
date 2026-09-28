import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const registrations = sqliteTable('registrations', {
  submissionId: text('submission_id').primaryKey(),
  reference: text('reference').notNull(),
  payloadHash: text('payload_hash').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  track: text('track').notNull(),
  teamName: text('team_name').notNull().default(''),
  consentVersion: text('consent_version').notNull(),
  createdAt: text('created_at').notNull(),
}, table => [uniqueIndex('registrations_email_unique').on(table.email)]);

export const registrationRateLimits = sqliteTable('registration_rate_limits', {
  key: text('key').primaryKey(),
  window: integer('window').notNull(),
  count: integer('count').notNull(),
});

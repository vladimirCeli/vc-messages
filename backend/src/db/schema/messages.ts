import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { conversations } from './conversations'
import { users } from './users'

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('text').notNull(),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  mediaSize: integer('media_size'),
  replyToId: uuid('reply_to_id').references((): any => messages.id),
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  convCreatedIdx: index('msg_conv_created_idx').on(table.conversationId, table.createdAt),
  senderIdx: index('msg_sender_idx').on(table.senderId),
}))

export const messageReads = pgTable('message_reads', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => ({
  msgUserIdx: index('read_msg_user_idx').on(table.messageId, table.userId),
}))

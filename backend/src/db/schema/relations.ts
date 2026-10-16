import { relations } from 'drizzle-orm'
import { users } from './users'
import { conversations, conversationParticipants } from './conversations'
import { messages, messageReads } from './messages'

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  participations: many(conversationParticipants),
  messageReads: many(messageReads),
}))

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  reads: many(messageReads),
}))

import { pgTable, serial, timestamp, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 博客文章表
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial().primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_created_at_idx").on(table.created_at),
  ]
);

// 用户表
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(), // 哈希加密存储
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
  ]
);

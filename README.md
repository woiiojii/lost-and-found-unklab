# UNKLAB Lost & Found System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Convex](https://img.shields.io/badge/Convex-Serverless-orange?logo=convex)](https://convex.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

> Sistem Barang Hilang & Temuan Digital – Universitas Klabat (UNKLAB)  
> Academic research MVP implementation based on the Software Engineering paper.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS (custom design system) |
| Backend | Convex (serverless mutations, queries, real-time subscriptions) |
| Storage | Convex File Storage (item photos) |
| Auth | Custom session-based auth with bcryptjs |

## Quick Start

```bash
npm install
npx convex login
npx convex dev          # Start Convex + copy URL to .env.local
npx convex run auth:seedCategories  # Seed categories once
npm run dev             # Start Next.js
```

## Features

- 🔐 **Integrated Auth** – Register/Login with NIM/NIP, role selection (User/Admin)
- 📋 **Lost & Found Reports** – Create reports with photo upload to Convex Storage
- 🔍 **Real-time Search** – Filter by keyword, category, type, status
- 🛡️ **Claim System** – Submit ownership proof, admin verifies/rejects
- 🔔 **Live Notifications** – Real-time bell using Convex subscriptions
- 👮 **Admin Panel** – Moderate content, review claims, update statuses
- 📊 **Status Timeline** – Full history of status changes per item

## Database Schema

6 entities: `users`, `categories`, `itemReports`, `claims`, `notifications`, `statusHistory`

## Color Palette

| Role | Color |
|------|-------|
| Primary (Trust/Recovery) | Emerald `#10b981` |
| Secondary (Action) | Magenta `#d946ef` |
| Background | `#f8fafc` |

# Yaser USMLE Step 1 Platform - API Endpoints Summary

This document provides a comprehensive summary of all API endpoints available in the Yaser USMLE Step 1 backend, organized by module and access level.

## 🔑 Authentication
**Base Path:** `/api/v1/auth`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user account |
| `POST` | `/login` | Authenticate and receive access/refresh tokens |
| `POST` | `/logout` | Invalidate current session |
| `POST` | `/refresh` | Refresh access token using refresh token |
| `POST` | `/forgot-password` | Request a password reset email |
| `POST` | `/reset-password/:token` | Reset password using a valid token |

## 👤 Profile Management
**Base Path:** `/api/v1/profile`
*All routes require authentication.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/me` | Get current user's profile details |
| `PATCH` | `/me` | Update profile information |
| `PATCH` | `/me/avatar` | Update user avatar |
| `PATCH` | `/change-password` | Change account password |

## 🎓 Student Module
Endpoints specifically for students to manage their learning.

### 📚 Courses
**Base Path:** `/api/v1/student/courses`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/my-courses` | List all courses student is enrolled in |
| `GET` | `/:id/units` | Get course content (units/lessons) |
| `GET` | `/:id/exams` | Get exams related to a specific course |

### 📝 Exams
**Base Path:** `/api/v1/student/exams`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all available exams for the student |
| `GET` | `/:id` | Get details of a specific exam |
| `POST` | `/:id/start` | Start an exam attempt |
| `POST` | `/:id/submit` | Submit exam answers |
| `GET` | `/:id/results/:submissionId` | View exam results and score |

### 🏛️ Classes
**Base Path:** `/api/v1/student/classes`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List student's classes |
| `GET` | `/:id` | Get class details |
| `POST` | `/:id/enroll` | Enroll in a class |
| `DELETE` | `/:id/unenroll` | Unenroll from a class |

### 💳 Financials & Coupons
| Path | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/student/financials` | `POST` | `/checkout` | Process a payment/checkout |
| `/api/v1/student/financials` | `GET` | `/my-payments` | View payment history |
| `/api/v1/student/financials` | `GET` | `/my-subscriptions` | View active subscriptions |
| `/api/v1/student/coupons` | `POST` | `/validate` | Validate a coupon code |

---

## 👨‍🏫 Instructor Module
Endpoints for instructors and the instructor panel.

### 📊 Panel & Dashboard
**Base Path:** `/api/v1/instructor-panel`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard` | Get instructor dashboard statistics |
| `GET` | `/classes` | List classes managed by the instructor |
| `GET` | `/performance` | View performance analytics |

### 📝 Exam Management
**Base Path:** `/api/v1/instructor/exams`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Create a new exam |
| `PATCH` | `/:id` | Update exam details |
| `DELETE` | `/:id` | Delete an exam |
| `POST` | `/:id/questions` | Add a question to an exam |
| `PATCH` | `/:id/questions/:questionId` | Update a specific question |
| `DELETE` | `/:id/questions/:questionId` | Remove a question |
| `GET` | `/:id/submissions` | View student submissions for an exam |

---

## 🛠️ Admin Module
Full management endpoints for platform administrators.

### 👥 User & Instructor Management
| Path | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/users` | `GET` | `/` | List all users with filters |
| `/api/v1/admin/users` | `GET` | `/:id` | Get detailed user info |
| `/api/v1/admin/users` | `PATCH` | `/:id` | Update any user info |
| `/api/v1/admin/users` | `PATCH` | `/:id/toggle-active` | Deactivate/Activate user |
| `/api/v1/admin/users` | `DELETE` | `/:id` | Permanently delete user |
| `/api/v1/admin/instructors` | `GET` | `/` | List all instructors |
| `/api/v1/admin/instructors` | `POST` | `/` | Create a new instructor |

### 🏗️ Content Management (Courses, Units, Lessons)
| Path | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/courses` | `POST` | `/` | Create a new course |
| `/api/v1/admin/courses` | `PATCH` | `/:id` | Update course details |
| `/api/v1/admin/courses` | `PATCH` | `/:id/assign-instructor` | Assign instructor to course |
| `/api/v1/admin/units` | `POST` | `/` | Create a unit in a course |
| `/api/v1/admin/lessons` | `POST` | `/` | Create a lesson in a unit |

### 💰 Financials & Coupons
| Path | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/financials` | `POST` | `/packages` | Create subscription package |
| `/api/v1/admin/financials` | `GET` | `/payments` | View all platform payments |
| `/api/v1/admin/financials` | `PATCH` | `/payments/:id/approve` | Approve a pending payment |
| `/api/v1/admin/coupons` | `POST` | `/` | Create a new coupon |
| `/api/v1/admin/coupons` | `GET` | `/:id/usages` | View coupon usage history |

---

## 🌍 Public Endpoints
Available without authentication.

| Path | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/courses` | `GET` | `/` | List all public courses |
| `/api/v1/courses` | `GET` | `/:id` | Get public course details |
| `/api/v1/instructors` | `GET` | `/` | List platform instructors |
| `/api/v1/packages` | `GET` | `/` | List available subscription packages |
| `/api/health` | `GET` | `/` | API Health Check |

--
-- PostgreSQL database dump
--

\restrict UnZjxB93KyTU1eZtmT25GmT5wseb4CCPTTz6I4JfNoKDzDuuspdSm2g9ZPYhUOT

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    module text NOT NULL,
    "recordId" text,
    description text NOT NULL,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    "enterpriseId" text NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    department text,
    email text,
    phone text,
    zalo text,
    linkedin text,
    notes text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: enterprise_faculties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_faculties (
    "enterpriseId" text NOT NULL,
    "departmentId" text NOT NULL
);


--
-- Name: enterprise_majors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_majors (
    "enterpriseId" text NOT NULL,
    "departmentId" text NOT NULL
);


--
-- Name: enterprise_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_tags (
    id text NOT NULL,
    name text NOT NULL,
    "enterpriseId" text NOT NULL
);


--
-- Name: enterprises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprises (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "shortName" text,
    "taxCode" text,
    field text NOT NULL,
    scale text NOT NULL,
    type text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    website text,
    linkedin text,
    description text,
    status text NOT NULL,
    priority text NOT NULL,
    "picId" text,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: event_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_departments (
    "eventId" text NOT NULL,
    "departmentId" text NOT NULL,
    "isLead" boolean DEFAULT false NOT NULL
);


--
-- Name: event_enterprises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_enterprises (
    "eventId" text NOT NULL,
    "enterpriseId" text NOT NULL,
    role text
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    location text NOT NULL,
    description text,
    budget numeric(12,2),
    "joinCount" integer DEFAULT 0 NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: interaction_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interaction_contacts (
    "interactionId" text NOT NULL,
    "contactId" text NOT NULL
);


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id text NOT NULL,
    "enterpriseId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    result text,
    "followUpTasks" text,
    "followUpDeadline" timestamp(3) without time zone,
    "followUpStatus" text DEFAULT 'NONE'::text NOT NULL,
    "picId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id text NOT NULL,
    "enterpriseId" text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    description text NOT NULL,
    requirements text,
    majors text NOT NULL,
    location text,
    salary text NOT NULL,
    "dateDeadline" timestamp(3) without time zone NOT NULL,
    "contactName" text,
    "contactEmail" text,
    "contactPhone" text,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: partnership_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partnership_documents (
    id text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    "enterpriseId" text NOT NULL,
    "departmentId" text NOT NULL,
    "signDate" timestamp(3) without time zone NOT NULL,
    "effectiveDate" timestamp(3) without time zone NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "picId" text,
    content text NOT NULL,
    status text NOT NULL,
    "fileUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "group" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "dueDate" timestamp(3) without time zone NOT NULL,
    status text NOT NULL,
    priority text NOT NULL,
    "enterpriseId" text,
    "interactionId" text,
    "assigneeId" text NOT NULL,
    "creatorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "departmentId" text,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
eb441718-9ab7-4b01-af5d-323846f3908f	a072948fefc1393d43a89ea5d61bf7355c6a89e30afe50defbb98dcc11c008ef	2026-08-21 01:32:06.054312+09	20260623022703_init	\N	\N	2026-08-21 01:32:05.884374+09	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, module, "recordId", description, "ipAddress", "createdAt") FROM stdin;
fb7438a1-144d-487d-ac21-f21e6e9ababc	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:33:10.647
7cfb8d30-baad-4fb1-9246-0f1500ac89f1	u-admin	CREATE_JOB	JOB	82982920-7d29-4dae-a6b6-2e4678736ed5	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:33:26.36
f67254bb-cbc2-4249-bbf6-9d1bc9f17dd6	u-admin	CREATE_EVENT	EVENT	953e09e1-c122-40e9-94d2-e7079c1b2ae3	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:33:37.38
58418b2b-42c1-4acc-838f-c7b903e04c30	u-admin	CREATE_DEPARTMENT	MASTER_DATA	e03cea8a-d43f-4c54-afa9-0b2f47bbd16b	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:33:54.679
d07027ec-3a87-4832-b1b0-5b38f3f61d00	u-admin	DELETE_DEPARTMENT	MASTER_DATA	e03cea8a-d43f-4c54-afa9-0b2f47bbd16b	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:33:57.288
80bfe068-8ec0-4d57-b12a-581ad861d704	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:34:00.914
9db8de11-4cfb-4c77-a3da-e0b2af3644b6	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:34:02.995
e08dc638-e871-4a7f-b16f-317e9b9b18e6	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:34:36.494
464fc143-1d95-4dea-9605-8a09a5f7f486	u-admin	CREATE_JOB	JOB	d00eade1-8208-4c58-90b2-050524366dd9	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:34:51.782
10df7261-a6fe-4f39-bb0b-764dd2aaab61	u-admin	CREATE_EVENT	EVENT	7a147c13-8e8b-42cd-8940-1fcba01a0feb	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:35:02.406
5c0335f7-409a-4a4c-b8c4-d25041885764	u-admin	CREATE_DEPARTMENT	MASTER_DATA	0740e4e8-d318-42df-8068-5e37eab4958b	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:35:18.379
e21cc242-f79a-4880-b0c4-3caaf838bde0	u-admin	DELETE_DEPARTMENT	MASTER_DATA	0740e4e8-d318-42df-8068-5e37eab4958b	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:35:20.131
d4f5e51e-4ee1-4de6-9a2f-d404eea6fd33	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:35:23.882
154e6004-88f8-4ffd-98c9-40c8cfc53ccf	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:35:26.131
9a5f7bfe-f1b5-4cea-97af-a5ca6af6ed40	u-leader	LOGIN	AUTH	u-leader	Người dùng PGS. TS. Trần Đức Hải đăng nhập thành công.	127.0.0.1	2026-08-20 16:37:28.71
8f8f5f37-498c-480b-9d95-cd4aad233bdc	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:43:36.269
952f6b03-0f92-465b-8f17-384a7220b368	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:43:54.51
dd7c4195-bc4e-4fc0-8b5b-016a88ad0e33	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:48:37.635
54df168b-e06e-4d27-950a-bab8a4120fae	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:55:28.213
ed4d4f2f-0dd8-447a-b11a-142bf991b4e8	u-admin	CREATE_JOB	JOB	68ecf006-85a4-43f5-924d-da2642b38fd4	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:55:43.537
37e18404-640b-4d72-af4b-43a77313d063	u-admin	UPDATE_JOB	JOB	68ecf006-85a4-43f5-924d-da2642b38fd4	Cập nhật tin tuyển dụng: TEST Tin tuyen dung tu dong.	127.0.0.1	2026-08-20 16:55:46.247
9dff9a67-1804-4521-a2aa-f561bd23a483	u-admin	DELETE_JOB	JOB	68ecf006-85a4-43f5-924d-da2642b38fd4	Xóa tin tuyển dụng: TEST Tin tuyen dung tu dong (da sua).	127.0.0.1	2026-08-20 16:55:49.529
b019339a-1c2c-4018-a7bf-2393870448e7	u-admin	CREATE_EVENT	EVENT	8cf7bb63-2ff2-44d6-9fba-336cd8e5583b	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:55:54.094
acd46981-325a-4021-886c-9e27af3c653d	u-admin	DELETE_EVENT	EVENT	8cf7bb63-2ff2-44d6-9fba-336cd8e5583b	Xóa sự kiện: TEST Su kien tu dong.	127.0.0.1	2026-08-20 16:55:55.866
b73af934-3cdd-41b9-b5e5-246130990bdd	u-admin	CREATE_TASK	TASK	43cb403d-1b45-40ea-bef9-ecf14dbdc268	Giao công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:55:59.726
c7e0f07e-8ce8-482f-a2db-3cf15a782e67	u-admin	UPDATE_TASK	TASK	43cb403d-1b45-40ea-bef9-ecf14dbdc268	Cập nhật công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:56:02.473
05d00735-600d-462a-bf62-8bca827c3dd2	u-admin	DELETE_TASK	TASK	43cb403d-1b45-40ea-bef9-ecf14dbdc268	Xóa công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:56:05.328
d8a0fd7c-8da7-4c13-b346-08e040f26cf7	u-admin	CREATE_DEPARTMENT	MASTER_DATA	8b9a9e56-0dcf-48a4-8cd1-3ec51da7bb44	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:56:10.072
bb5531b0-feb2-4a49-ac76-d1164eb0d0b3	u-admin	DELETE_DEPARTMENT	MASTER_DATA	8b9a9e56-0dcf-48a4-8cd1-3ec51da7bb44	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:56:11.844
22200b11-0c49-44dc-9c49-5dd7d4c18d4f	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:56:15.605
c79899ef-ac82-4102-8a57-ab2bcc4dd607	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:56:17.825
13361cf5-f80f-4716-8f86-6cfbd1e3bcf1	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:56:42.715
be2b376e-55be-4126-b7e1-680fd33d37a4	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:56:56.493
af275a06-413f-4e31-b73b-63aa079a9f50	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:59:01.991
ce345da3-87d5-40d9-99d8-a88860b7224e	u-admin	CREATE_JOB	JOB	2f985b3f-112f-4166-9c7b-80c883ced876	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:59:17.27
0fa23c5c-d2a1-4d83-872b-61f4c79df4f1	u-admin	UPDATE_JOB	JOB	2f985b3f-112f-4166-9c7b-80c883ced876	Cập nhật tin tuyển dụng: TEST Tin tuyen dung tu dong.	127.0.0.1	2026-08-20 16:59:20.046
24c12882-c54d-42e2-a1f1-0f37ff1dd3dd	u-admin	DELETE_JOB	JOB	2f985b3f-112f-4166-9c7b-80c883ced876	Xóa tin tuyển dụng: TEST Tin tuyen dung tu dong (da sua).	127.0.0.1	2026-08-20 16:59:23.27
64a8a846-694f-4e6d-bb06-4f0d32b5b69a	u-admin	CREATE_EVENT	EVENT	691d7797-b22c-4355-ae4e-a4ad3f9e016d	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:59:27.909
0814d985-ac2d-44fb-aa00-2330eca73e0b	u-admin	DELETE_EVENT	EVENT	691d7797-b22c-4355-ae4e-a4ad3f9e016d	Xóa sự kiện: TEST Su kien tu dong.	127.0.0.1	2026-08-20 16:59:29.694
b9cfd2bc-aeb1-4469-8ee6-82a9f462eac2	u-admin	CREATE_TASK	TASK	515a1bc8-27b7-4c25-8dbc-7b611d9f499a	Giao công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:59:33.589
bb78464a-f1b2-4671-b9fd-53815ca8b8ce	u-admin	UPDATE_TASK	TASK	515a1bc8-27b7-4c25-8dbc-7b611d9f499a	Cập nhật công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:59:36.338
f456275b-1bb2-4f16-90ec-b914a006bd7c	u-admin	DELETE_TASK	TASK	515a1bc8-27b7-4c25-8dbc-7b611d9f499a	Xóa công việc: TEST Cong viec tu dong.	127.0.0.1	2026-08-20 16:59:39.207
10d63e88-a7ff-4850-ab42-4679944a76d3	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:59:51.691
a993080f-f454-49ca-a908-e2bd81b60bb1	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 17:00:29.035
fdbfc542-b964-450e-9577-86f41df189a3	u-admin	CREATE_DEPARTMENT	MASTER_DATA	fdcf5917-d8da-4404-adf5-c7cdf78d4bb3	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:59:43.913
eb42737f-5ba4-4c9e-bbe8-8ddfd3f1a801	u-admin	DELETE_DEPARTMENT	MASTER_DATA	fdcf5917-d8da-4404-adf5-c7cdf78d4bb3	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:59:45.69
3e2b8fc8-1b17-4f5d-b01e-b85077b46b3b	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:59:49.462
18307071-85ea-4d46-9529-fffa4a9dbc62	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 17:00:10.255
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, "enterpriseId", name, "position", department, email, phone, zalo, linkedin, notes, "isPrimary", "isActive", "createdAt", "updatedAt") FROM stdin;
c-fpt-1	e-fpt	Bà Nguyễn Thị Hoàng Yến	Trưởng phòng Thu hút tài năng trẻ	Phòng Tuyển dụng FSOFT	yen_n_hoang@fsoft.com.vn	0904555888	0904555888	\N	Đầu mối chính về thực tập.	t	t	2026-08-20 16:32:10.012	2026-08-20 16:58:32.193
c-fpt-2	e-fpt	Ông Lương Minh Hữu	Giám đốc Nhân sự (CHRO)	Ban Giám đốc Nhân sự	huu_l_minh@fpt.com	0912111222	\N	\N	Tham gia các sự kiện ký kết.	f	t	2026-08-20 16:32:10.018	2026-08-20 16:58:32.201
c-viettel-1	e-viettel	Thiếu tá Trần Quang Hưng	Giám đốc Hợp tác Giáo dục & Tuyển dụng	Ban Nhân sự Tập đoàn	hungtq_viettel@viettel.com.vn	0982333777	0982333777	\N	Nhiệt tình tham gia talkshow IoT & 5G.	t	t	2026-08-20 16:32:10.021	2026-08-20 16:58:32.207
c-vng-1	e-vng	Ông Trần Thanh Sơn	Giám đốc Khối Kỹ thuật	Khối Cloud & Data	son.tt@vng.com.vn	0903222444	0903222444	\N	Đầu mối bàn hợp tác hạ tầng Cloud cho phòng Lab.	t	t	2026-08-20 16:32:10.024	2026-08-20 16:58:32.214
c-tcb-1	e-tcb	Bà Phạm Minh Thư	Trưởng ban Tuyển dụng & Thương hiệu	Khối Nhân sự	thu.pm@techcombank.com.vn	0988111333	\N	\N	Quan tâm chương trình học bổng cho Khoa KTQL.	t	t	2026-08-20 16:32:10.026	2026-08-20 16:58:32.218
c-vnpt-1	e-vnpt	Ông Lê Quang Huy	Phó ban Đào tạo	Ban Tổ chức Nhân sự	huylq@vnpt.vn	0912777888	\N	\N	Mới tiếp cận qua hội thảo ngành.	t	t	2026-08-20 16:32:10.028	2026-08-20 16:58:32.22
c-cmc-1	e-cmc	Bà Vũ Thị Lan	Chuyên viên Hợp tác Đại học	Phòng Nhân sự	lanvt@cmc.com.vn	0977555666	\N	\N	Đã chuyển công tác, cần xin đầu mối mới.	t	f	2026-08-20 16:32:10.031	2026-08-20 16:58:32.227
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, code, type, "parentId", "createdAt", "updatedAt") FROM stdin;
d-qhdn	Phòng Quan hệ Doanh nghiệp	P_QHDN	PHONG	\N	2026-08-20 16:32:07.75	2026-08-20 16:58:29.737
d-support	Trung tâm Hỗ trợ Sinh viên & Việc làm	TT_HTSV	TRUNG_TAM	\N	2026-08-20 16:32:07.756	2026-08-20 16:58:29.74
d-startup	Trung tâm Đổi mới Sáng tạo & Khởi nghiệp	TT_DMST_KN	TRUNG_TAM	\N	2026-08-20 16:32:07.758	2026-08-20 16:58:29.741
d-cntt	Khoa Công nghệ thông tin	K_CNTT	KHOA	\N	2026-08-20 16:32:07.76	2026-08-20 16:58:29.743
d-dtvt	Khoa Điện tử Viễn thông	K_DTVT	KHOA	\N	2026-08-20 16:32:07.762	2026-08-20 16:58:29.745
d-ktql	Khoa Kinh tế & Quản lý	K_KTQL	KHOA	\N	2026-08-20 16:32:07.764	2026-08-20 16:58:29.747
\.


--
-- Data for Name: enterprise_faculties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprise_faculties ("enterpriseId", "departmentId") FROM stdin;
e-fpt	d-cntt
e-fpt	d-dtvt
e-viettel	d-cntt
e-viettel	d-dtvt
e-vng	d-cntt
e-vnpt	d-dtvt
e-vnpt	d-cntt
e-oldpartner	d-ktql
\.


--
-- Data for Name: enterprise_majors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprise_majors ("enterpriseId", "departmentId") FROM stdin;
e-fpt	d-cntt
e-viettel	d-dtvt
e-vng	d-cntt
e-vnpt	d-dtvt
e-oldpartner	d-ktql
\.


--
-- Data for Name: enterprise_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprise_tags (id, name, "enterpriseId") FROM stdin;
59e9d131-8e65-46ed-bd7a-3f3b5791e8d5	Lab Thiết Bị	e-fpt
d7a47090-2399-47c6-8e2b-2ed4b55e90b9	Học Bổng	e-fpt
8e79d7fd-0e10-446d-9636-dacaaaa5f98f	Internship	e-fpt
1c848425-2650-4878-8cba-b8c77ffa72e7	Chiến Lược	e-fpt
f31530c2-7a44-41df-8742-e4863a2e0922	Nghiên Cứu	e-viettel
84197b2b-638c-45f5-9111-ac87d7d5caab	Security	e-viettel
e60b8043-297a-4e22-805f-8d7fd47fa0ef	Quốc Phòng	e-viettel
6d87f9da-9143-4362-be8e-993baf146966	Viễn Thông	e-viettel
346515cb-882f-4886-8c94-94023b7de545	Fintech	e-vng
153b1c39-f067-4540-8c06-b19e6524897e	ZaloPay	e-vng
26c81e3e-83fd-4a10-af2f-3504e344266b	Cloud-Lab	e-vng
7adebc70-d895-4300-801f-0b9670561843	Viễn Thông	e-vnpt
47551503-1f19-4d74-8666-9c8d83ed92f8	Chuyển Đổi Số	e-vnpt
1fb9f7f9-5046-47cf-91ec-e3b95f3f4e76	Đã Kết Thúc	e-oldpartner
\.


--
-- Data for Name: enterprises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprises (id, code, name, "shortName", "taxCode", field, scale, type, address, city, website, linkedin, description, status, priority, "picId", "internalNotes", "createdAt", "updatedAt", "deletedAt") FROM stdin;
e-fpt	DN-FSOFT	Công ty Cổ phần Phần mềm FPT (FPT Software)	FPT Software	0101248141	Công nghệ thông tin & Viễn thông	Trên 500 nhân sự	Tư nhân Việt Nam	Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu	Hà Nội	https://fptsoftware.com	https://linkedin.com/company/fpt-software	Doanh nghiệp xuất khẩu phần mềm lớn nhất Việt Nam.	DANG_TRIEN_KHAI	CHIEN_LUOC	u-an	Tài trợ thiết bị phòng Lab hàng năm.	2026-08-20 16:32:09.962	2026-08-20 16:58:32.142	\N
e-viettel	DN-VIETTEL	Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel	Viettel Group	0100109106	Viễn thông, An ninh mạng & Công nghệ cao	Trên 500 nhân sự	Doanh nghiệp Nhà nước	Lô D26, Khu đô thị mới Cầu Giấy	Hà Nội	https://viettel.com.vn	https://linkedin.com/company/viettel-group	Tập đoàn công nghệ, viễn thông hàng đầu Việt Nam.	DA_KY_MOU	CHIEN_LUOC	u-an	Vừa ký lại MOU năm nay.	2026-08-20 16:32:09.98	2026-08-20 16:58:32.156	\N
e-oldpartner	DN-ABC	Công ty TNHH Thương mại ABC	ABC Trading	0102233445	Thương mại & Phân phối	Dưới 100 nhân sự	Tư nhân Việt Nam	Số 12 Lê Trọng Tấn, Thanh Xuân	Hà Nội	\N	\N	Đối tác cũ, quy mô nhỏ, không còn phù hợp định hướng đào tạo.	NGUNG_HOP_TAC	THUONG	u-dung	Đã kết thúc hợp tác từ 2025, lưu hồ sơ để tra cứu lịch sử.	2026-08-20 16:32:10.007	2026-08-20 16:58:32.189	\N
e-tcb	DN-TCB	Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)	Techcombank	0100230800	Tài chính & Ngân hàng	Trên 500 nhân sự	Tư nhân Việt Nam	Số 6 Phố Quang Trung, Hoàn Kiếm	Hà Nội	https://techcombank.com	https://linkedin.com/company/techcombank	Ngân hàng TMCP hàng đầu định hướng số hóa.	TAM_NGUNG	TIEM_NANG	u-dung	Khoa KTQL đề xuất tiếp cận xin quỹ học bổng.	2026-08-20 16:32:09.991	2026-08-20 16:59:49.441	\N
e-cmc	DN-CMC	Công ty Cổ phần Tập đoàn Công nghệ CMC	CMC Corp	0100778687	Công nghệ thông tin & Tích hợp hệ thống	Trên 500 nhân sự	Tư nhân Việt Nam	Tòa CMC, 11 Duy Tân, Cầu Giấy	Hà Nội	https://cmc.com.vn	\N	Tập đoàn công nghệ lớn thứ hai Việt Nam.	TIEM_NANG	TIEM_NANG	u-an	Tạm dừng do đối tác thay đổi nhân sự phụ trách, sẽ liên hệ lại đầu năm sau.	2026-08-20 16:32:10.002	2026-08-20 16:59:51.669	\N
e-vng	DN-VNG	Công ty Cổ phần VNG (VNG Corporation)	VNG Corp	0303491621	Công nghệ thông tin & Game & Fintech	Trên 500 nhân sự	Tư nhân Việt Nam	Z06 Đường số 13, Tân Thuận Đông, Quận 7	TP. Hồ Chí Minh	https://vng.com.vn	https://linkedin.com/company/vng	Kỳ lân công nghệ đầu tiên của Việt Nam.	DANG_TRAO_DOI	QUAN_TRONG	u-an	Đang bàn hợp tác Server Cloud.	2026-08-20 16:32:09.985	2026-08-20 16:58:32.16	\N
e-vnpt	DN-VNPT	Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)	VNPT	0100684378	Viễn thông & Chuyển đổi số	Trên 500 nhân sự	Doanh nghiệp Nhà nước	Số 57 Huỳnh Thúc Kháng, Đống Đa	Hà Nội	https://vnpt.com.vn	\N	Tập đoàn viễn thông nhà nước, trọng tâm chuyển đổi số quốc gia.	DANG_TIEP_CAN	QUAN_TRONG	u-dung	Đã gửi thư mời hợp tác, chờ phản hồi từ Ban Nhân sự.	2026-08-20 16:32:09.996	2026-08-20 16:58:32.175	\N
\.


--
-- Data for Name: event_departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_departments ("eventId", "departmentId", "isLead") FROM stdin;
ev-fpt-1	d-qhdn	f
ev-fpt-1	d-cntt	f
ev-work-1	d-startup	f
ev-work-1	d-cntt	f
ev-jobfair-1	d-qhdn	f
ev-jobfair-1	d-support	f
ev-mentor-1	d-dtvt	f
ev-mentor-1	d-support	f
ev-sponsor-1	d-startup	f
ev-tour-cancel	d-cntt	f
\.


--
-- Data for Name: event_enterprises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_enterprises ("eventId", "enterpriseId", role) FROM stdin;
ev-fpt-1	e-fpt	\N
ev-work-1	e-vng	\N
ev-work-1	e-viettel	\N
ev-jobfair-1	e-fpt	\N
ev-jobfair-1	e-viettel	\N
ev-jobfair-1	e-tcb	\N
ev-jobfair-1	e-vng	\N
ev-mentor-1	e-viettel	\N
ev-sponsor-1	e-vng	\N
ev-tour-cancel	e-cmc	\N
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, type, date, location, description, budget, "joinCount", status, "createdAt", "updatedAt") FROM stdin;
ev-fpt-1	FPT Software Day 2026	COMPANY_TOUR	2026-08-30 16:58:32.341	FPT Software Campus, Hòa Lạc	Tham quan doanh nghiệp, đăng ký phỏng vấn thực tập.	15000000.00	120	UPCOMING	2026-08-20 16:32:10.109	2026-08-20 16:58:32.342
ev-work-1	Seminar: AI ứng dụng trong Đổi mới sáng tạo 2026	WORKSHOP	2026-08-12 16:58:32.341	Hội trường Thư viện Tạ Quang Bửu	Workshop định hướng AI và ươm tạo start-up.	35000000.00	450	COMPLETED	2026-08-20 16:32:10.119	2026-08-20 16:58:32.35
ev-jobfair-1	Ngày hội việc làm & Kết nối doanh nghiệp HUST 2026	JOB_FAIR	2026-09-14 16:58:32.341	Sân vận động Đại học Bách khoa Hà Nội	Hơn 40 doanh nghiệp tham gia tuyển dụng trực tiếp tại trường.	120000000.00	0	UPCOMING	2026-08-20 16:32:10.123	2026-08-20 16:58:32.356
ev-mentor-1	Chương trình Mentor 1-1 cùng chuyên gia Viettel	MENTORSHIP	2026-08-18 16:58:32.341	Học trực tuyến qua MS Teams	20 sinh viên xuất sắc được kèm cặp định hướng nghề nghiệp.	8000000.00	20	ONGOING	2026-08-20 16:32:10.128	2026-08-20 16:58:32.361
ev-sponsor-1	Tài trợ cuộc thi Khởi nghiệp Sáng tạo HUST	SPONSORSHIP	2026-06-21 16:58:32.341	Hội trường C2, ĐH Bách khoa Hà Nội	VNG tài trợ giải thưởng và suất ươm tạo cho 3 đội thắng.	50000000.00	180	COMPLETED	2026-08-20 16:32:10.132	2026-08-20 16:58:32.368
ev-tour-cancel	Tham quan Trung tâm dứ liệu CMC	COMPANY_TOUR	2026-07-16 16:58:32.341	CMC Data Center, Hà Nội	Hủy do đối tác thay đổi nhân sự phụ trách.	\N	0	CANCELLED	2026-08-20 16:32:10.136	2026-08-20 16:58:32.372
\.


--
-- Data for Name: interaction_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interaction_contacts ("interactionId", "contactId") FROM stdin;
i-fpt-1	c-fpt-1
i-fpt-1	c-fpt-2
i-fpt-2	c-fpt-1
i-viettel-1	c-viettel-1
i-viettel-2	c-viettel-1
i-vng-1	c-vng-1
i-tcb-1	c-tcb-1
i-vnpt-1	c-vnpt-1
\.


--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interactions (id, "enterpriseId", date, type, content, result, "followUpTasks", "followUpDeadline", "followUpStatus", "picId", "createdAt", "updatedAt") FROM stdin;
i-vnpt-1	e-vnpt	2026-08-12 16:58:32.228	PROPOSAL	Gửi thư mời hợp tác đào tạo và tiếp nhận thực tập sinh ngành ĐTVT.	Chưa có phản hồi chính thức.	Gọi điện nhắc lại sau 1 tuần.	2026-08-21 16:58:32.228	PENDING	u-dung	2026-08-20 16:32:10.064	2026-08-20 16:58:32.269
i-abc-1	e-oldpartner	2025-02-20 00:00:00	MEETING_OFFLINE	Họp tổng kết hợp tác và thống nhất kết thúc thỏa thuận.	Hai bên đồng thuận không gia hạn hợp đồng nguyên tắc.	\N	\N	NONE	u-dung	2026-08-20 16:58:32.272	2026-08-20 16:58:32.272
i-cmc-1	e-cmc	2026-05-22 16:58:32.228	FOLLOW_UP	Liên hệ theo dõi sau hội thảo, đầu mối cũ đã chuyển công tác.	Tạm dừng tiếp cận, chờ xác định đầu mối mới.	\N	\N	NONE	u-an	2026-08-20 16:32:10.068	2026-08-20 16:58:32.282
i-fpt-1	e-fpt	2026-07-31 16:58:32.228	MEETING_OFFLINE	Họp triển khai kế hoạch tiếp nhận 150 thực tập sinh kỳ hè 2026.	Thống nhất số lượng và lịch phỏng vấn tháng 6.	Gửi danh sách sinh viên đăng ký cho FPT.	2026-08-15 16:58:32.228	COMPLETED	u-an	2026-08-20 16:32:10.035	2026-08-20 16:58:32.23
i-fpt-2	e-fpt	2026-08-14 16:58:32.228	EMAIL	Trao đổi email xác nhận danh sách 30 sinh viên vòng phỏng vấn đợt 1.	FPT đã nhận danh sách, sẽ phản hồi kết quả trong 2 tuần.	Theo dõi kết quả phỏng vấn.	2026-08-28 16:58:32.228	PENDING	u-an	2026-08-20 16:32:10.044	2026-08-20 16:58:32.238
i-viettel-1	e-viettel	2026-07-06 16:58:32.228	MOU_SIGNING	Lễ ký kết MOU hợp tác nghiên cứu AI & mạng viễn thông giai đoạn 2026-2029.	Đã ký MOU 09/2026, kèm cam kết 20 suất học bổng/năm.	\N	\N	NONE	u-an	2026-08-20 16:32:10.048	2026-08-20 16:58:32.244
i-viettel-2	e-viettel	2026-08-10 16:58:32.228	WORKSHOP	Phối hợp tổ chức talkshow định hướng nghề IoT & 5G cho sinh viên Khoa ĐTVT.	Hơn 300 sinh viên tham dự, phản hồi rất tích cực.	Gửi thư cảm ơn và báo cáo tổng kết cho đối tác.	2026-08-23 16:58:32.228	PENDING	u-minh	2026-08-20 16:32:10.051	2026-08-20 16:58:32.252
i-vng-1	e-vng	2026-08-06 16:58:32.228	MEETING_ONLINE	Họp trực tuyến thảo luận phương án tài trợ hạ tầng Cloud cho phòng Lab AI.	VNG đề xuất gói credit thử nghiệm 12 tháng, chờ duyệt nội bộ.	Chuẩn bị đề xuất chi tiết nhu cầu hạ tầng.	2026-08-25 16:58:32.228	PENDING	u-dung	2026-08-20 16:32:10.055	2026-08-20 16:58:32.258
i-tcb-1	e-tcb	2026-07-21 16:58:32.228	CALL	Gọi điện giới thiệu chương trình hợp tác và đề xuất quỹ học bổng Khoa KTQL.	Đối tác quan tâm, đề nghị gửi hồ sơ giới thiệu qua email.	Gửi bộ hồ sơ giới thiệu nhà trường.	2026-08-22 16:58:32.228	PENDING	u-dung	2026-08-20 16:32:10.059	2026-08-20 16:58:32.263
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, "enterpriseId", title, type, quantity, description, requirements, majors, location, salary, "dateDeadline", "contactName", "contactEmail", "contactPhone", status, "createdAt", "updatedAt") FROM stdin;
j-fpt-1	e-fpt	Thực tập sinh Lập trình Web Full stack (React & Node.js)	INTERN	30	Đào tạo 2 tháng có trợ cấp, tham gia dự án thực tế.	Nắm vững CTDL, giải thuật, JS/HTML/CSS.	Công nghệ thông tin, Hệ thống thông tin	FPT Software Tower, Hà Nội	3,000,000đ - 6,000,000đ	2026-09-14 16:58:32.317	Nguyễn Thị Hoàng Yến	yen_n_hoang@fsoft.com.vn	0904555888	ACTIVE	2026-08-20 16:32:10.091	2026-08-20 16:58:32.319
j-vng-1	e-vng	Kỹ sư Phát triển Trí tuệ Nhân tạo di động	FULLTIME	5	Tích hợp NLP và Generative AI lên Zalo.	Python, PyTorch, TensorFlow.	Khoa học máy tính, Trí tuệ nhân tạo	VNG Campus, TP.HCM	18,000,000đ - 25,000,000đ	2026-10-04 16:58:32.317	HR VNG Career	cv@vng.com.vn	\N	ACTIVE	2026-08-20 16:32:10.097	2026-08-20 16:58:32.324
j-viettel-1	e-viettel	Thực tập sinh Kỹ thuật mạng & An ninh thông tin	INTERN	20	Tham gia vận hành hạ tầng mạng lõi và giám sát an ninh.	Kiến thức mạng TCP/IP, Linux cơ bản.	Điện tử Viễn thông, An toàn thông tin	Viện Nghiên cứu Viettel, Hà Nội	4,000,000đ - 7,000,000đ	2026-09-24 16:58:32.317	Trần Quang Hưng	hungtq_viettel@viettel.com.vn	0982333777	ACTIVE	2026-08-20 16:32:10.1	2026-08-20 16:58:32.33
j-tcb-1	e-tcb	Chuyên viên Phân tích dữ liệu kinh doanh (Fresher)	FULLTIME	8	Phân tích dữ liệu khách hàng, lập báo cáo cho khối bán lẻ.	SQL, Excel nâng cao, Power BI.	Kinh tế, Quản trị kinh doanh, Hệ thống thông tin	Techcombank Tower, Hà Nội	12,000,000đ - 16,000,000đ	2026-09-09 16:58:32.317	Phạm Minh Thư	thu.pm@techcombank.com.vn	0988111333	NEW	2026-08-20 16:32:10.103	2026-08-20 16:58:32.334
j-fpt-2	e-fpt	Cộng tác viên Kiểm thử phần mềm (Part-time)	CTV	10	Thực hiện test case thủ công cho các dự án outsourcing.	Có thể làm 20h/tuần, cẩn thận.	Công nghệ thông tin	Làm việc từ xa	40,000đ/giờ	2026-08-17 16:58:32.317	Nguyễn Thị Hoàng Yến	yen_n_hoang@fsoft.com.vn	\N	CLOSED	2026-08-20 16:32:10.106	2026-08-20 16:58:32.339
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", title, content, type, "isRead", link, "createdAt") FROM stdin;
n-1	u-an	MOU sắp hết hiệu lực	Văn bản 15/MOU-HUST-VNG với VNG Corp sắp đến hạn, cần liên hệ tái ký.	MOU_EXPIRY	f	/mous	2026-08-20 16:32:10.165
n-2	u-dung	Công việc đến hạn hôm nay	Gọi điện nhắc lại thư mời hợp tác VNPT.	TASK_DUE	f	/tasks	2026-08-20 16:32:10.169
n-3	u-dung	Nhắc theo dõi tương tác	Techcombank đang chờ hồ sơ giới thiệu nhà trường.	INTERACTION_REMINDER	f	/enterprises	2026-08-20 16:32:10.171
n-4	u-admin	Hệ thống đã sẵn sàng	Dữ liệu khởi tạo đã được nạp đầy đủ. Vui lòng đổi mật khẩu mặc định sau lần đăng nhập đầu tiên.	SYSTEM	f	\N	2026-08-20 16:32:10.173
n-5	u-minh	Công việc được giao	Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G.	TASK_DUE	t	/tasks	2026-08-20 16:32:10.175
\.


--
-- Data for Name: partnership_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partnership_documents (id, code, type, "enterpriseId", "departmentId", "signDate", "effectiveDate", "expiryDate", "picId", content, status, "fileUrl", "createdAt", "updatedAt") FROM stdin;
mou-fpt	12/2025/MOU-HUST-FPT	MOU	e-fpt	d-qhdn	2025-05-10 00:00:00	2025-05-10 00:00:00	2027-05-10 00:00:00	u-an	Hợp tác đào tạo thực hành, tiếp nhận 150 thực tập sinh/năm.	DA_KY	/files/mou_hust_fpt_signed.pdf	2026-08-20 16:32:10.071	2026-08-20 16:58:32.289
mou-viettel	09/2026/MOU-HUST-VIETTEL	MOU	e-viettel	d-qhdn	2026-03-01 00:00:00	2026-03-01 00:00:00	2029-03-01 00:00:00	u-an	Nghiên cứu chung AI & Mạng viễn thông, trao học bổng.	DA_KY	/files/mou_hust_viettel_signed.pdf	2026-08-20 16:32:10.078	2026-08-20 16:58:32.296
mou-vng	15/MOU-HUST-VNG	MOU	e-vng	d-qhdn	2024-08-15 00:00:00	2024-08-15 00:00:00	2026-08-15 00:00:00	u-dung	Cung cấp hạ tầng số thử nghiệm, đào tạo AI/Cloud.	DA_KY	\N	2026-08-20 16:32:10.081	2026-08-20 16:58:32.299
mou-tcb-draft	21/2026/MOU-HUST-TCB	MOU	e-tcb	d-ktql	2026-09-19 16:58:32.288	2026-09-19 16:58:32.288	2028-09-18 16:58:32.288	u-dung	Dự thảo hợp tác cấp học bổng và tiếp nhận thực tập khối Kinh tế.	SOAN_THAO	\N	2026-08-20 16:32:10.083	2026-08-20 16:58:32.305
mou-vnpt-review	22/2026/MOA-HUST-VNPT	MOA	e-vnpt	d-dtvt	2026-09-04 16:58:32.288	2026-09-04 16:58:32.288	2029-09-03 16:58:32.288	u-dung	Thỏa thuận phối hợp đào tạo kỹ năng số, đang trình Ban Giám hiệu ký.	TRINH_KY	\N	2026-08-20 16:32:10.086	2026-08-20 16:58:32.309
mou-abc-expired	05/2023/MOU-HUST-ABC	CONTRACT	e-oldpartner	d-ktql	2023-03-01 00:00:00	2023-03-01 00:00:00	2025-03-01 00:00:00	u-dung	Hợp đồng nguyên tắc đã hết hiệu lực, lưu hồ sơ tra cứu.	HET_HAN	\N	2026-08-20 16:32:10.089	2026-08-20 16:58:32.313
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, code, "group", "createdAt", "updatedAt") FROM stdin;
p1	Xem tất cả doanh nghiệp	view_all_enterprises	ENTERPRISE	2026-08-20 16:32:07.722	2026-08-20 16:58:29.714
p2	Xem doanh nghiệp được gán	view_assigned_enterprises	ENTERPRISE	2026-08-20 16:32:07.727	2026-08-20 16:58:29.717
p3	Tạo doanh nghiệp mới	create_enterprise	ENTERPRISE	2026-08-20 16:32:07.73	2026-08-20 16:58:29.719
p4	Chỉnh sửa doanh nghiệp	edit_enterprise	ENTERPRISE	2026-08-20 16:32:07.731	2026-08-20 16:58:29.72
p5	Xóa doanh nghiệp	delete_enterprise	ENTERPRISE	2026-08-20 16:32:07.734	2026-08-20 16:58:29.722
p6	Quản lý người liên hệ	manage_contacts	CONTACT	2026-08-20 16:32:07.735	2026-08-20 16:58:29.724
p7	Quản lý nhật ký tương tác	manage_interactions	INTERACTION	2026-08-20 16:32:07.737	2026-08-20 16:58:29.725
p8	Quản lý thỏa thuận MOU	manage_mou	MOU	2026-08-20 16:32:07.739	2026-08-20 16:58:29.727
p9	Quản lý tin tuyển dụng	manage_jobs	JOB	2026-08-20 16:32:07.741	2026-08-20 16:58:29.729
p10	Quản lý sự kiện hợp tác	manage_events	EVENT	2026-08-20 16:32:07.744	2026-08-20 16:58:29.73
p11	Xem Dashboard tổng quan	view_dashboard	DASHBOARD	2026-08-20 16:32:07.745	2026-08-20 16:58:29.732
p12	Quản lý người dùng hệ thống	manage_users	ADMIN	2026-08-20 16:32:07.747	2026-08-20 16:58:29.734
p13	Quản lý danh mục chung	manage_master_data	ADMIN	2026-08-20 16:32:07.749	2026-08-20 16:58:29.735
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions ("roleId", "permissionId") FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, code, description, "createdAt", "updatedAt") FROM stdin;
r-admin	Super Admin	SUPER_ADMIN	Quản trị viên toàn hệ thống và phân quyền	2026-08-20 16:32:07.699	2026-08-20 16:58:29.694
r-leader	Lãnh đạo / Ban Giám hiệu	LEADER	Xem báo cáo, KPIs, giám sát hợp tác	2026-08-20 16:32:07.709	2026-08-20 16:58:29.702
r-qhdn-mgr	Quản trị phòng QHDN	QHDN_MANAGER	Duyệt dữ liệu, điều phối cán bộ phòng QHDN	2026-08-20 16:32:07.711	2026-08-20 16:58:29.704
r-qhdn-staff	Chuyên viên QHDN	QHDN_STAFF	Cập nhật trực tiếp thông tin doanh nghiệp, MOU, liên hệ	2026-08-20 16:32:07.713	2026-08-20 16:58:29.706
r-faculty	Cán bộ đại diện Khoa	FACULTY_REPRESENTATIVE	Quản lý hợp tác liên quan trực tiếp đến khoa	2026-08-20 16:32:07.715	2026-08-20 16:58:29.708
r-student	Trung tâm Hỗ trợ SV	STUDENT_SUPPORT	Quản lý tuyển dụng, thực tập, sự kiện việc làm	2026-08-20 16:32:07.718	2026-08-20 16:58:29.71
r-startup	Trung tâm Đổi mới Sáng tạo	INNOVATION_CENTER	Đồng hành khởi nghiệp, tài trợ đề án	2026-08-20 16:32:07.72	2026-08-20 16:58:29.712
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, "dueDate", status, priority, "enterpriseId", "interactionId", "assigneeId", "creatorId", "createdAt", "updatedAt") FROM stdin;
t-8	Tổng hợp danh sách sinh viên đăng ký Ngày hội việc làm 2026	Phối hợp Trung tâm Hỗ trợ SV mở đơn đăng ký.	2026-09-01 16:58:32.378	TODO	HIGH	\N	\N	u-an	u-admin	2026-08-20 16:32:10.16	2026-08-20 16:58:32.401
t-9	Gửi danh sách sinh viên thực tập đợt 1 cho FPT	Đã hoàn thành và được đối tác xác nhận.	2026-08-15 16:58:32.378	COMPLETED	MEDIUM	e-fpt	i-fpt-1	u-an	u-dung	2026-08-20 16:32:10.162	2026-08-20 16:58:32.404
t-1	Lời mời anh Hưng họp góp ý CTĐT Điện tử	Hẹn lịch họp tại khoa DTVT.	2026-08-21 16:58:32.378	TODO	HIGH	e-viettel	\N	u-an	u-dung	2026-08-20 16:32:10.141	2026-08-20 16:58:32.379
t-3	Theo dõi gia hạn văn bản MOU với VNG	MOU hết hạn 15/08/2026, liên hệ tái ký.	2026-09-04 16:58:32.378	TODO	HIGH	e-vng	\N	u-dung	u-dung	2026-08-20 16:32:10.147	2026-08-20 16:58:32.382
t-4	Gửi bộ hồ sơ giới thiệu nhà trường cho Techcombank	Kèm đề xuất quỹ học bổng Khoa KTQL.	2026-08-22 16:58:32.378	IN_PROGRESS	MEDIUM	e-tcb	i-tcb-1	u-dung	u-dung	2026-08-20 16:32:10.15	2026-08-20 16:58:32.387
t-5	Gọi điện nhắc lại thư mời hợp tác VNPT	Đã gửi đề xuất 8 ngày trước, chưa có phản hồi.	2026-08-21 16:58:32.378	TODO	MEDIUM	e-vnpt	i-vnpt-1	u-dung	u-admin	2026-08-20 16:32:10.153	2026-08-20 16:58:32.391
t-6	Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G	Gửi cho đầu mối Viettel sau sự kiện.	2026-08-23 16:58:32.378	TODO	LOW	e-viettel	i-viettel-2	u-minh	u-dung	2026-08-20 16:32:10.155	2026-08-20 16:58:32.393
t-7	Chuẩn bị đề xuất nhu cầu hạ tầng Cloud cho phòng Lab AI	Tổng hợp cấu hình và dự toán credit cần VNG tài trợ.	2026-08-25 16:58:32.378	IN_PROGRESS	HIGH	e-vng	i-vng-1	u-an	u-dung	2026-08-20 16:32:10.157	2026-08-20 16:58:32.398
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", "fullName", phone, "isActive", "departmentId", "roleId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
u-admin	admin@hust.edu.vn	$2b$12$VjWc02NPbRS8G9/.5Vwwv.ft8y5Vu9fGWqbhmJgvyGRkfewowRBUe	Nguyễn Văn Admin	0901234567	t	d-qhdn	r-admin	2026-08-20 16:32:08.206	2026-08-20 16:58:30.213	\N
u-leader	bgh.hai@hust.edu.vn	$2b$12$Z.kxd7Dg3kiC.l/FtqqhvuMiPAveon07gE7jaQiO2gC0el7jGTVOi	PGS. TS. Trần Đức Hải	0987654321	t	\N	r-leader	2026-08-20 16:32:08.673	2026-08-20 16:58:30.643	\N
u-dung	qhdn.dung@hust.edu.vn	$2b$12$ccIazVG8lf3T4saHTc3Wz.5NHE9x1ML2uLxrwZmHJElMt2IpMgNNa	ThS. Hoàng Trung Dũng	0912345678	t	d-qhdn	r-qhdn-mgr	2026-08-20 16:32:09.103	2026-08-20 16:58:31.098	\N
u-an	qhdn.an@hust.edu.vn	$2b$12$oPwR6BT4ZZhdxRPQF9im6e8mgC/6iZLDGPq42BID5drZUQcKYZkNy	CN. Lê Hoài An	0934567890	t	d-qhdn	r-qhdn-staff	2026-08-20 16:32:09.526	2026-08-20 16:58:31.708	\N
u-minh	cntt.minh@hust.edu.vn	$2b$12$cSsOgukzyDPShN1F3OFs6.cGTdkJPe7xwCqZpCHlDj.3RKpDqM6tq	TS. Nguyễn Khánh Minh	0945678901	t	d-cntt	r-faculty	2026-08-20 16:32:09.958	2026-08-20 16:58:32.137	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: enterprise_faculties enterprise_faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_faculties
    ADD CONSTRAINT enterprise_faculties_pkey PRIMARY KEY ("enterpriseId", "departmentId");


--
-- Name: enterprise_majors enterprise_majors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_majors
    ADD CONSTRAINT enterprise_majors_pkey PRIMARY KEY ("enterpriseId", "departmentId");


--
-- Name: enterprise_tags enterprise_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_tags
    ADD CONSTRAINT enterprise_tags_pkey PRIMARY KEY (id);


--
-- Name: enterprises enterprises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprises
    ADD CONSTRAINT enterprises_pkey PRIMARY KEY (id);


--
-- Name: event_departments event_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_departments
    ADD CONSTRAINT event_departments_pkey PRIMARY KEY ("eventId", "departmentId");


--
-- Name: event_enterprises event_enterprises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_enterprises
    ADD CONSTRAINT event_enterprises_pkey PRIMARY KEY ("eventId", "enterpriseId");


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: interaction_contacts interaction_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_contacts
    ADD CONSTRAINT interaction_contacts_pkey PRIMARY KEY ("interactionId", "contactId");


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partnership_documents partnership_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partnership_documents
    ADD CONSTRAINT partnership_documents_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY ("roleId", "permissionId");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_module_idx ON public.audit_logs USING btree (module);


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: contacts_enterpriseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contacts_enterpriseId_idx" ON public.contacts USING btree ("enterpriseId");


--
-- Name: departments_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code);


--
-- Name: departments_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);


--
-- Name: enterprise_tags_name_enterpriseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "enterprise_tags_name_enterpriseId_key" ON public.enterprise_tags USING btree (name, "enterpriseId");


--
-- Name: enterprises_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_code_idx ON public.enterprises USING btree (code);


--
-- Name: enterprises_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX enterprises_code_key ON public.enterprises USING btree (code);


--
-- Name: enterprises_picId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enterprises_picId_idx" ON public.enterprises USING btree ("picId");


--
-- Name: enterprises_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_priority_idx ON public.enterprises USING btree (priority);


--
-- Name: enterprises_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_status_idx ON public.enterprises USING btree (status);


--
-- Name: interactions_enterpriseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interactions_enterpriseId_idx" ON public.interactions USING btree ("enterpriseId");


--
-- Name: interactions_picId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interactions_picId_idx" ON public.interactions USING btree ("picId");


--
-- Name: jobs_enterpriseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_enterpriseId_idx" ON public.jobs USING btree ("enterpriseId");


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: partnership_documents_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partnership_documents_code_key ON public.partnership_documents USING btree (code);


--
-- Name: partnership_documents_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "partnership_documents_departmentId_idx" ON public.partnership_documents USING btree ("departmentId");


--
-- Name: partnership_documents_enterpriseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "partnership_documents_enterpriseId_idx" ON public.partnership_documents USING btree ("enterpriseId");


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: roles_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: tasks_assigneeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_assigneeId_idx" ON public.tasks USING btree ("assigneeId");


--
-- Name: tasks_enterpriseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tasks_enterpriseId_idx" ON public.tasks USING btree ("enterpriseId");


--
-- Name: users_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_departmentId_idx" ON public.users USING btree ("departmentId");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_roleId_idx" ON public.users USING btree ("roleId");


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: departments departments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enterprise_faculties enterprise_faculties_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_faculties
    ADD CONSTRAINT "enterprise_faculties_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enterprise_faculties enterprise_faculties_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_faculties
    ADD CONSTRAINT "enterprise_faculties_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enterprise_majors enterprise_majors_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_majors
    ADD CONSTRAINT "enterprise_majors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enterprise_majors enterprise_majors_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_majors
    ADD CONSTRAINT "enterprise_majors_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enterprise_tags enterprise_tags_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_tags
    ADD CONSTRAINT "enterprise_tags_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enterprises enterprises_picId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprises
    ADD CONSTRAINT "enterprises_picId_fkey" FOREIGN KEY ("picId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: event_departments event_departments_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_departments
    ADD CONSTRAINT "event_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_departments event_departments_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_departments
    ADD CONSTRAINT "event_departments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_enterprises event_enterprises_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_enterprises
    ADD CONSTRAINT "event_enterprises_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_enterprises event_enterprises_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_enterprises
    ADD CONSTRAINT "event_enterprises_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interaction_contacts interaction_contacts_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_contacts
    ADD CONSTRAINT "interaction_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interaction_contacts interaction_contacts_interactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_contacts
    ADD CONSTRAINT "interaction_contacts_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES public.interactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "interactions_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_picId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "interactions_picId_fkey" FOREIGN KEY ("picId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: jobs jobs_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: partnership_documents partnership_documents_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partnership_documents
    ADD CONSTRAINT "partnership_documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: partnership_documents partnership_documents_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partnership_documents
    ADD CONSTRAINT "partnership_documents_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: partnership_documents partnership_documents_picId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partnership_documents
    ADD CONSTRAINT "partnership_documents_picId_fkey" FOREIGN KEY ("picId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_enterpriseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES public.enterprises(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_interactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES public.interactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict UnZjxB93KyTU1eZtmT25GmT5wseb4CCPTTz6I4JfNoKDzDuuspdSm2g9ZPYhUOT


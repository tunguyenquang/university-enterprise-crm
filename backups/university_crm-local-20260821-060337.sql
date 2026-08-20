--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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
4c30a8fa-7019-4b6b-975d-1d0ac01d312f	a072948fefc1393d43a89ea5d61bf7355c6a89e30afe50defbb98dcc11c008ef	2026-08-20 22:46:44.779028+07	20260623022703_init	\N	\N	2026-08-20 22:46:44.708916+07	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, module, "recordId", description, "ipAddress", "createdAt") FROM stdin;
4f6d2914-f125-4952-8397-b17296925b9e	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:47:34.169
62ce0d52-cb16-4114-995a-999388caca5d	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:47:51.933
4b0882f3-d0d4-46d9-ad8f-958b6892d272	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:48:50.032
79f7988d-b2b4-4555-9a55-408bccd17fc4	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:49:07.092
a9f32b7e-babe-4a91-8fc8-1960142abab0	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:49:08.378
6621f3b8-5c93-417d-bee8-8da58ea86e31	u-admin	CREATE_MOU	MOU	8ed86140-c179-446d-8701-87baeab1a30c	Lập văn bản thỏa thuận MOU mang số MOU-2026-964 với DN.	127.0.0.1	2026-08-20 15:49:38.101
a7bc7b34-758f-4349-9494-f65579314bbf	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:50:47.097
acc24316-96fd-4ac7-9c26-caa3d87f80d2	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:51:48.918
63e6def3-ffc6-425e-a1cc-2a59726749da	u-admin	CREATE_JOB	JOB	d4e0a8ef-685a-4f77-ad7c-80c6b7ba1205	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 15:52:04.092
4cdc05e8-b2e1-47d6-8972-122df626d1fe	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:54:32.684
2c3b01fa-a65e-43c0-bc27-d3ecb6882bf9	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:54:42.197
896b9f25-0195-42ea-a64a-50ce7423781d	u-admin	CREATE_JOB	JOB	42e6a328-0d1a-4ddb-8e8a-2956b2fe8ac0	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 15:54:57.39
312b7adc-e590-46aa-9ecf-349b3c4a5991	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:56:00.34
34bdadd8-09a7-4d52-bc41-1a4670d28110	u-admin	CREATE_JOB	JOB	3d660c67-2f4d-4f09-ad2f-13a7c52ea590	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 15:56:17.285
0c3c2b0a-84a4-431a-9645-f4167b35c2cc	u-admin	CREATE_EVENT	EVENT	22b467d3-9235-4ff2-8f48-e5923d588138	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 15:56:39.792
9891897f-e654-4271-aa4d-57f2ff213b8f	u-admin	CREATE_DEPARTMENT	MASTER_DATA	23e2573b-01b6-4a3f-b18e-8846cb2c198b	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 15:56:52.709
8eed99cf-cbf5-4991-a733-20b628f5fde5	u-admin	DELETE_DEPARTMENT	MASTER_DATA	23e2573b-01b6-4a3f-b18e-8846cb2c198b	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 15:56:54.366
13ac905d-0859-4765-b6e1-6acd36695002	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 15:56:58.112
90d94623-5fd2-4b4f-9b11-e2223c099a14	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 15:57:00.255
68ec6391-1b80-4862-8e9f-8ecc837724d6	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 15:57:21.342
f4ac4d83-ac35-4791-8d8e-c24dbb2d557a	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:00:09.92
d438b068-b99d-4884-865e-f57df34f1aa9	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:02:21.925
51b05afb-d3c7-4bed-9cee-628cb137f7d2	u-admin	CREATE_JOB	JOB	ad00e536-f461-4389-9ead-2e11d1f65c7f	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:02:37.385
6e01d152-2cf9-4b47-b599-8cce3b5adc53	u-admin	CREATE_EVENT	EVENT	eef4f46c-8f72-471b-9f18-023bc29f6c45	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:02:46.926
326d81f7-d5ee-4da7-a71a-ef4d4d14bae2	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:03:10.997
1b6a190c-055e-43de-8655-72259dc73d83	u-admin	CREATE_JOB	JOB	2ffb191e-6773-43da-bd03-373d813f5cbf	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:03:26.228
cc185997-e300-4f3e-8215-d37e75fe7bb8	u-admin	CREATE_EVENT	EVENT	a960681d-24b9-4ab3-82f8-9ef3e276ae12	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:03:35.717
8bf723fc-e317-4a9f-9c94-85fb5745415b	u-admin	CREATE_DEPARTMENT	MASTER_DATA	3b383081-b89d-42a0-a3c9-425de441ce49	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:03:49.11
0e203128-df69-488d-b991-d3c44baa27f8	u-admin	DELETE_DEPARTMENT	MASTER_DATA	3b383081-b89d-42a0-a3c9-425de441ce49	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:03:50.696
5dedd394-df2d-4cf1-80f8-b0fea75f3523	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:03:54.44
f4c69eea-ecc2-4ce0-a4f2-6761d25e67cb	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:03:56.687
c0c5f8f4-90f4-4585-b39d-60bdeea6c706	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:04:12.513
cd5a4d45-5d94-4c92-b20f-01b1241da8bb	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:04:32.835
becf43ea-2e3e-464f-8c5f-9eb4448528de	u-admin	CREATE_JOB	JOB	961f2d10-02fc-4688-9709-fffd31305ad4	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:04:48.009
310bf68f-2a10-47cf-87d4-ea0a670a7f6f	u-admin	CREATE_EVENT	EVENT	171ea268-2754-4135-9e53-c478aa58434c	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:04:57.524
9f4bc871-4eba-42da-8847-e495ad0ef71f	u-admin	CREATE_DEPARTMENT	MASTER_DATA	3c10bae0-6ba7-4066-96fe-2a1f5339f15f	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:05:10.957
94683a96-4269-48f9-be89-74d6149ed03f	u-admin	DELETE_DEPARTMENT	MASTER_DATA	3c10bae0-6ba7-4066-96fe-2a1f5339f15f	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:05:12.541
432846ca-c9e6-4774-b294-13baac056da4	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:05:16.252
1ade33b1-7bba-4c3f-ae20-882146c680f1	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:05:18.478
23fcf1f2-861f-40c9-b489-79547f0aae00	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:05:45.135
c599b7ae-b8e2-4b1a-b825-6cde89760c2b	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:06:12.448
d0808618-f92b-428b-b400-6271fd6e185a	u-admin	CREATE_JOB	JOB	0c7e9d0c-a430-41f5-b2f4-481c0c9eaea2	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:06:27.661
3e79f6fd-4ec2-4505-8af6-d9dfd351f07d	u-admin	CREATE_EVENT	EVENT	7c1e291f-46a9-457c-97a0-40bce093602d	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:06:37.17
663c8fc5-5de0-4104-9925-f83f6d662c21	u-admin	CREATE_DEPARTMENT	MASTER_DATA	b29f6e4d-26f9-4068-be60-1c5ac1a1cc57	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:06:51.885
ca4f81dc-2580-47ac-956a-0a603963c72c	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:06:59.444
cc51657f-10b0-40d4-b01e-96213946a891	u-admin	DELETE_DEPARTMENT	MASTER_DATA	b29f6e4d-26f9-4068-be60-1c5ac1a1cc57	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:06:53.485
1fae18e6-b967-492d-9a1f-2e42c51c6ee7	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:06:57.193
32bfdae7-6eff-46ab-8a1b-b661b015eb76	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:07:30.27
4190e8c9-3608-491b-8dcb-ea06c608470c	u-admin	CREATE_JOB	JOB	c5c10cda-f58f-4b5f-a6e6-f4be06ddd79f	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:07:45.457
59c83740-46fd-4341-8c19-829b38893fbc	u-admin	CREATE_EVENT	EVENT	949299f8-9674-4213-bb4b-bdce4c96465c	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:07:54.967
74f8ebd5-9642-4d12-bfbb-d8467141df23	u-admin	CREATE_DEPARTMENT	MASTER_DATA	ce086fcd-fbf3-4924-b319-3592f233236e	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:08:10.631
11b1e1be-684c-4ba9-be83-1d049d070ab6	u-admin	DELETE_DEPARTMENT	MASTER_DATA	ce086fcd-fbf3-4924-b319-3592f233236e	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:08:12.219
2aefb4cb-1e61-479f-8877-55dee20d143d	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:08:15.944
033330bb-10fc-4c2e-99c6-4e9d6d744477	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:08:18.179
e1919c95-ab72-463c-ac6e-36e9ca091205	u-admin	LOGIN	AUTH	u-admin	Người dùng Nguyễn Văn Admin đăng nhập thành công.	127.0.0.1	2026-08-20 16:09:28.207
991ac798-884b-4541-a0dc-5c2014d3d776	u-admin	CREATE_JOB	JOB	4e6e56a9-92bc-49e2-9a08-e7ec73c9bed6	Đăng tải nhu cầu tuyển dụng: TEST Tin tuyen dung tu dong tại DN.	127.0.0.1	2026-08-20 16:09:43.431
1734945b-7000-45c7-a7ae-9fb7d4b2c772	u-admin	CREATE_EVENT	EVENT	3ea483a0-fbc1-4289-9855-048f39d3afa5	Tạo sự kiện liên kết doanh nghiệp: TEST Su kien tu dong	127.0.0.1	2026-08-20 16:09:52.878
cf2c69c5-4910-4c5e-a0db-f3fa6acd70b4	u-admin	CREATE_DEPARTMENT	MASTER_DATA	d36f885e-db12-4293-9253-5fadfc6550ec	Tạo đơn vị: TEST Don vi tu dong (TEST_AUTO).	127.0.0.1	2026-08-20 16:10:08.56
d2fb6012-562f-4d0a-adfa-87e00339dbe3	u-admin	DELETE_DEPARTMENT	MASTER_DATA	d36f885e-db12-4293-9253-5fadfc6550ec	Xóa đơn vị TEST Don vi tu dong.	127.0.0.1	2026-08-20 16:10:10.148
71a231bd-9175-43dd-862d-6a2c183e8301	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-tcb	Cập nhật hồ sơ doanh nghiệp Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank).	127.0.0.1	2026-08-20 16:10:13.889
7e84f3cf-3910-4d0c-971d-8594e042cf30	u-admin	UPDATE_ENTERPRISE	ENTERPRISE	e-cmc	Cập nhật hồ sơ doanh nghiệp Công ty Cổ phần Tập đoàn Công nghệ CMC.	127.0.0.1	2026-08-20 16:10:16.142
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, "enterpriseId", name, "position", department, email, phone, zalo, linkedin, notes, "isPrimary", "isActive", "createdAt", "updatedAt") FROM stdin;
c-fpt-1	e-fpt	Bà Nguyễn Thị Hoàng Yến	Trưởng phòng Thu hút tài năng trẻ	Phòng Tuyển dụng FSOFT	yen_n_hoang@fsoft.com.vn	0904555888	0904555888	\N	Đầu mối chính về thực tập.	t	t	2026-08-20 15:46:45.814	2026-08-20 16:57:37.998
c-fpt-2	e-fpt	Ông Lương Minh Hữu	Giám đốc Nhân sự (CHRO)	Ban Giám đốc Nhân sự	huu_l_minh@fpt.com	0912111222	\N	\N	Tham gia các sự kiện ký kết.	f	t	2026-08-20 15:46:45.816	2026-08-20 16:57:37.999
c-viettel-1	e-viettel	Thiếu tá Trần Quang Hưng	Giám đốc Hợp tác Giáo dục & Tuyển dụng	Ban Nhân sự Tập đoàn	hungtq_viettel@viettel.com.vn	0982333777	0982333777	\N	Nhiệt tình tham gia talkshow IoT & 5G.	t	t	2026-08-20 15:46:45.816	2026-08-20 16:57:38
c-vng-1	e-vng	Ông Trần Thanh Sơn	Giám đốc Khối Kỹ thuật	Khối Cloud & Data	son.tt@vng.com.vn	0903222444	0903222444	\N	Đầu mối bàn hợp tác hạ tầng Cloud cho phòng Lab.	t	t	2026-08-20 15:46:45.817	2026-08-20 16:57:38
c-tcb-1	e-tcb	Bà Phạm Minh Thư	Trưởng ban Tuyển dụng & Thương hiệu	Khối Nhân sự	thu.pm@techcombank.com.vn	0988111333	\N	\N	Quan tâm chương trình học bổng cho Khoa KTQL.	t	t	2026-08-20 15:46:45.818	2026-08-20 16:57:38.001
c-vnpt-1	e-vnpt	Ông Lê Quang Huy	Phó ban Đào tạo	Ban Tổ chức Nhân sự	huylq@vnpt.vn	0912777888	\N	\N	Mới tiếp cận qua hội thảo ngành.	t	t	2026-08-20 15:46:45.819	2026-08-20 16:57:38.001
c-cmc-1	e-cmc	Bà Vũ Thị Lan	Chuyên viên Hợp tác Đại học	Phòng Nhân sự	lanvt@cmc.com.vn	0977555666	\N	\N	Đã chuyển công tác, cần xin đầu mối mới.	t	f	2026-08-20 15:46:45.819	2026-08-20 16:57:38.002
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, code, type, "parentId", "createdAt", "updatedAt") FROM stdin;
d-qhdn	Phòng Quan hệ Doanh nghiệp	P_QHDN	PHONG	\N	2026-08-20 15:46:45.532	2026-08-20 16:57:37.729
d-support	Trung tâm Hỗ trợ Sinh viên & Việc làm	TT_HTSV	TRUNG_TAM	\N	2026-08-20 15:46:45.534	2026-08-20 16:57:37.73
d-startup	Trung tâm Đổi mới Sáng tạo & Khởi nghiệp	TT_DMST_KN	TRUNG_TAM	\N	2026-08-20 15:46:45.535	2026-08-20 16:57:37.731
d-cntt	Khoa Công nghệ thông tin	K_CNTT	KHOA	\N	2026-08-20 15:46:45.535	2026-08-20 16:57:37.731
d-dtvt	Khoa Điện tử Viễn thông	K_DTVT	KHOA	\N	2026-08-20 15:46:45.536	2026-08-20 16:57:37.732
d-ktql	Khoa Kinh tế & Quản lý	K_KTQL	KHOA	\N	2026-08-20 15:46:45.536	2026-08-20 16:57:37.732
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
586c1e9d-1818-46fa-9cb9-c8c64d08e4ba	Lab Thiết Bị	e-fpt
e712655b-f339-4a4a-b3d3-5f040444647d	Học Bổng	e-fpt
7eed38e9-51ae-4ba7-8515-a5691c2419d3	Internship	e-fpt
80b475a7-a20a-4ff3-80ac-e9c020b4152e	Chiến Lược	e-fpt
09748a20-f37c-460f-b1ec-3d3e6b94cb61	Nghiên Cứu	e-viettel
29e5843c-015c-4b13-9f60-ef3f6c38a794	Security	e-viettel
19688ba6-67fc-487e-a630-2f4dc28bd5fd	Quốc Phòng	e-viettel
18e6d5aa-1334-4f63-811a-fae5988d07f2	Viễn Thông	e-viettel
2adfbe76-24f0-4fb0-8529-90b80df43e75	Fintech	e-vng
3fd63a5d-ae26-430d-bd8c-f1f79177ab45	ZaloPay	e-vng
d560a31b-943d-4339-a591-c5be8f9e034e	Cloud-Lab	e-vng
adddaaf9-bb86-42d9-92d2-7a70e17edcb2	Viễn Thông	e-vnpt
0124fbf8-f5d2-4520-ba39-f0afc3c51b11	Chuyển Đổi Số	e-vnpt
fb0db861-75bc-4c48-b6d1-f7bd24ac9600	Đã Kết Thúc	e-oldpartner
\.


--
-- Data for Name: enterprises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprises (id, code, name, "shortName", "taxCode", field, scale, type, address, city, website, linkedin, description, status, priority, "picId", "internalNotes", "createdAt", "updatedAt", "deletedAt") FROM stdin;
e-viettel	DN-VIETTEL	Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel	Viettel Group	0100109106	Viễn thông, An ninh mạng & Công nghệ cao	Trên 500 nhân sự	Doanh nghiệp Nhà nước	Lô D26, Khu đô thị mới Cầu Giấy	Hà Nội	https://viettel.com.vn	https://linkedin.com/company/viettel-group	Tập đoàn công nghệ, viễn thông hàng đầu Việt Nam.	DA_KY_MOU	CHIEN_LUOC	u-an	Vừa ký lại MOU năm nay.	2026-08-20 15:46:45.804	2026-08-20 16:57:37.99	\N
e-vng	DN-VNG	Công ty Cổ phần VNG (VNG Corporation)	VNG Corp	0303491621	Công nghệ thông tin & Game & Fintech	Trên 500 nhân sự	Tư nhân Việt Nam	Z06 Đường số 13, Tân Thuận Đông, Quận 7	TP. Hồ Chí Minh	https://vng.com.vn	https://linkedin.com/company/vng	Kỳ lân công nghệ đầu tiên của Việt Nam.	DANG_TRAO_DOI	QUAN_TRONG	u-an	Đang bàn hợp tác Server Cloud.	2026-08-20 15:46:45.806	2026-08-20 16:57:37.991	\N
e-tcb	DN-TCB	Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)	Techcombank	0100230800	Tài chính & Ngân hàng	Trên 500 nhân sự	Tư nhân Việt Nam	Số 6 Phố Quang Trung, Hoàn Kiếm	Hà Nội	https://techcombank.com	https://linkedin.com/company/techcombank	Ngân hàng TMCP hàng đầu định hướng số hóa.	TIEM_NANG	TIEM_NANG	u-dung	Khoa KTQL đề xuất tiếp cận xin quỹ học bổng.	2026-08-20 15:46:45.807	2026-08-20 16:57:37.993	\N
e-vnpt	DN-VNPT	Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)	VNPT	0100684378	Viễn thông & Chuyển đổi số	Trên 500 nhân sự	Doanh nghiệp Nhà nước	Số 57 Huỳnh Thúc Kháng, Đống Đa	Hà Nội	https://vnpt.com.vn	\N	Tập đoàn viễn thông nhà nước, trọng tâm chuyển đổi số quốc gia.	DANG_TIEP_CAN	QUAN_TRONG	u-dung	Đã gửi thư mời hợp tác, chờ phản hồi từ Ban Nhân sự.	2026-08-20 15:46:45.809	2026-08-20 16:57:37.994	\N
e-cmc	DN-CMC	Công ty Cổ phần Tập đoàn Công nghệ CMC	CMC Corp	0100778687	Công nghệ thông tin & Tích hợp hệ thống	Trên 500 nhân sự	Tư nhân Việt Nam	Tòa CMC, 11 Duy Tân, Cầu Giấy	Hà Nội	https://cmc.com.vn	\N	Tập đoàn công nghệ lớn thứ hai Việt Nam.	TAM_NGUNG	TIEM_NANG	u-an	Tạm dừng do đối tác thay đổi nhân sự phụ trách, sẽ liên hệ lại đầu năm sau.	2026-08-20 15:46:45.81	2026-08-20 16:57:37.995	\N
e-fpt	DN-FSOFT	Công ty Cổ phần Phần mềm FPT (FPT Software)	FPT Software	0101248141	Công nghệ thông tin & Viễn thông	Trên 500 nhân sự	Tư nhân Việt Nam	Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu	Hà Nội	https://fptsoftware.com	https://linkedin.com/company/fpt-software	Doanh nghiệp xuất khẩu phần mềm lớn nhất Việt Nam.	DANG_TRIEN_KHAI	CHIEN_LUOC	u-an	Tài trợ thiết bị phòng Lab hàng năm.	2026-08-20 15:46:45.797	2026-08-20 16:57:37.985	\N
e-oldpartner	DN-ABC	Công ty TNHH Thương mại ABC	ABC Trading	0102233445	Thương mại & Phân phối	Dưới 100 nhân sự	Tư nhân Việt Nam	Số 12 Lê Trọng Tấn, Thanh Xuân	Hà Nội	\N	\N	Đối tác cũ, quy mô nhỏ, không còn phù hợp định hướng đào tạo.	NGUNG_HOP_TAC	THUONG	u-dung	Đã kết thúc hợp tác từ 2025, lưu hồ sơ để tra cứu lịch sử.	2026-08-20 15:46:45.813	2026-08-20 16:57:37.997	\N
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
ev-fpt-1	FPT Software Day 2026	COMPANY_TOUR	2026-08-30 16:57:38.024	FPT Software Campus, Hòa Lạc	Tham quan doanh nghiệp, đăng ký phỏng vấn thực tập.	15000000.00	120	UPCOMING	2026-08-20 15:46:45.843	2026-08-20 16:57:38.025
ev-work-1	Seminar: AI ứng dụng trong Đổi mới sáng tạo 2026	WORKSHOP	2026-08-12 16:57:38.024	Hội trường Thư viện Tạ Quang Bửu	Workshop định hướng AI và ươm tạo start-up.	35000000.00	450	COMPLETED	2026-08-20 15:46:45.847	2026-08-20 16:57:38.027
ev-jobfair-1	Ngày hội việc làm & Kết nối doanh nghiệp HUST 2026	JOB_FAIR	2026-09-14 16:57:38.024	Sân vận động Đại học Bách khoa Hà Nội	Hơn 40 doanh nghiệp tham gia tuyển dụng trực tiếp tại trường.	120000000.00	0	UPCOMING	2026-08-20 15:46:45.848	2026-08-20 16:57:38.028
ev-mentor-1	Chương trình Mentor 1-1 cùng chuyên gia Viettel	MENTORSHIP	2026-08-18 16:57:38.024	Học trực tuyến qua MS Teams	20 sinh viên xuất sắc được kèm cặp định hướng nghề nghiệp.	8000000.00	20	ONGOING	2026-08-20 15:46:45.849	2026-08-20 16:57:38.03
ev-sponsor-1	Tài trợ cuộc thi Khởi nghiệp Sáng tạo HUST	SPONSORSHIP	2026-06-21 16:57:38.024	Hội trường C2, ĐH Bách khoa Hà Nội	VNG tài trợ giải thưởng và suất ươm tạo cho 3 đội thắng.	50000000.00	180	COMPLETED	2026-08-20 15:46:45.85	2026-08-20 16:57:38.03
ev-tour-cancel	Tham quan Trung tâm dứ liệu CMC	COMPANY_TOUR	2026-07-16 16:57:38.024	CMC Data Center, Hà Nội	Hủy do đối tác thay đổi nhân sự phụ trách.	\N	0	CANCELLED	2026-08-20 15:46:45.851	2026-08-20 16:57:38.031
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
i-cmc-1	e-cmc	2026-05-22 16:57:38.002	FOLLOW_UP	Liên hệ theo dõi sau hội thảo, đầu mối cũ đã chuyển công tác.	Tạm dừng tiếp cận, chờ xác định đầu mối mới.	\N	\N	NONE	u-an	2026-08-20 15:46:45.83	2026-08-20 16:57:38.015
i-fpt-1	e-fpt	2026-07-31 16:57:38.002	MEETING_OFFLINE	Họp triển khai kế hoạch tiếp nhận 150 thực tập sinh kỳ hè 2026.	Thống nhất số lượng và lịch phỏng vấn tháng 6.	Gửi danh sách sinh viên đăng ký cho FPT.	2026-08-15 16:57:38.002	COMPLETED	u-an	2026-08-20 15:46:45.82	2026-08-20 16:57:38.003
i-fpt-2	e-fpt	2026-08-14 16:57:38.002	EMAIL	Trao đổi email xác nhận danh sách 30 sinh viên vòng phỏng vấn đợt 1.	FPT đã nhận danh sách, sẽ phản hồi kết quả trong 2 tuần.	Theo dõi kết quả phỏng vấn.	2026-08-28 16:57:38.002	PENDING	u-an	2026-08-20 15:46:45.824	2026-08-20 16:57:38.006
i-viettel-1	e-viettel	2026-07-06 16:57:38.002	MOU_SIGNING	Lễ ký kết MOU hợp tác nghiên cứu AI & mạng viễn thông giai đoạn 2026-2029.	Đã ký MOU 09/2026, kèm cam kết 20 suất học bổng/năm.	\N	\N	NONE	u-an	2026-08-20 15:46:45.825	2026-08-20 16:57:38.007
i-viettel-2	e-viettel	2026-08-10 16:57:38.002	WORKSHOP	Phối hợp tổ chức talkshow định hướng nghề IoT & 5G cho sinh viên Khoa ĐTVT.	Hơn 300 sinh viên tham dự, phản hồi rất tích cực.	Gửi thư cảm ơn và báo cáo tổng kết cho đối tác.	2026-08-23 16:57:38.002	PENDING	u-minh	2026-08-20 15:46:45.826	2026-08-20 16:57:38.008
i-vng-1	e-vng	2026-08-06 16:57:38.002	MEETING_ONLINE	Họp trực tuyến thảo luận phương án tài trợ hạ tầng Cloud cho phòng Lab AI.	VNG đề xuất gói credit thử nghiệm 12 tháng, chờ duyệt nội bộ.	Chuẩn bị đề xuất chi tiết nhu cầu hạ tầng.	2026-08-25 16:57:38.002	PENDING	u-dung	2026-08-20 15:46:45.827	2026-08-20 16:57:38.009
i-tcb-1	e-tcb	2026-07-21 16:57:38.002	CALL	Gọi điện giới thiệu chương trình hợp tác và đề xuất quỹ học bổng Khoa KTQL.	Đối tác quan tâm, đề nghị gửi hồ sơ giới thiệu qua email.	Gửi bộ hồ sơ giới thiệu nhà trường.	2026-08-22 16:57:38.002	PENDING	u-dung	2026-08-20 15:46:45.828	2026-08-20 16:57:38.01
i-vnpt-1	e-vnpt	2026-08-12 16:57:38.002	PROPOSAL	Gửi thư mời hợp tác đào tạo và tiếp nhận thực tập sinh ngành ĐTVT.	Chưa có phản hồi chính thức.	Gọi điện nhắc lại sau 1 tuần.	2026-08-21 16:57:38.002	PENDING	u-dung	2026-08-20 15:46:45.829	2026-08-20 16:57:38.012
i-abc-1	e-oldpartner	2025-02-20 00:00:00	MEETING_OFFLINE	Họp tổng kết hợp tác và thống nhất kết thúc thỏa thuận.	Hai bên đồng thuận không gia hạn hợp đồng nguyên tắc.	\N	\N	NONE	u-dung	2026-08-20 16:57:38.013	2026-08-20 16:57:38.013
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, "enterpriseId", title, type, quantity, description, requirements, majors, location, salary, "dateDeadline", "contactName", "contactEmail", "contactPhone", status, "createdAt", "updatedAt") FROM stdin;
j-fpt-1	e-fpt	Thực tập sinh Lập trình Web Full stack (React & Node.js)	INTERN	30	Đào tạo 2 tháng có trợ cấp, tham gia dự án thực tế.	Nắm vững CTDL, giải thuật, JS/HTML/CSS.	Công nghệ thông tin, Hệ thống thông tin	FPT Software Tower, Hà Nội	3,000,000đ - 6,000,000đ	2026-09-14 16:57:38.02	Nguyễn Thị Hoàng Yến	yen_n_hoang@fsoft.com.vn	0904555888	ACTIVE	2026-08-20 16:09:18.164	2026-08-20 16:57:38.021
j-vng-1	e-vng	Kỹ sư Phát triển Trí tuệ Nhân tạo di động	FULLTIME	5	Tích hợp NLP và Generative AI lên Zalo.	Python, PyTorch, TensorFlow.	Khoa học máy tính, Trí tuệ nhân tạo	VNG Campus, TP.HCM	18,000,000đ - 25,000,000đ	2026-10-04 16:57:38.02	HR VNG Career	cv@vng.com.vn	\N	ACTIVE	2026-08-20 15:46:45.84	2026-08-20 16:57:38.022
j-viettel-1	e-viettel	Thực tập sinh Kỹ thuật mạng & An ninh thông tin	INTERN	20	Tham gia vận hành hạ tầng mạng lõi và giám sát an ninh.	Kiến thức mạng TCP/IP, Linux cơ bản.	Điện tử Viễn thông, An toàn thông tin	Viện Nghiên cứu Viettel, Hà Nội	4,000,000đ - 7,000,000đ	2026-09-24 16:57:38.02	Trần Quang Hưng	hungtq_viettel@viettel.com.vn	0982333777	ACTIVE	2026-08-20 15:46:45.84	2026-08-20 16:57:38.023
j-tcb-1	e-tcb	Chuyên viên Phân tích dữ liệu kinh doanh (Fresher)	FULLTIME	8	Phân tích dữ liệu khách hàng, lập báo cáo cho khối bán lẻ.	SQL, Excel nâng cao, Power BI.	Kinh tế, Quản trị kinh doanh, Hệ thống thông tin	Techcombank Tower, Hà Nội	12,000,000đ - 16,000,000đ	2026-09-09 16:57:38.02	Phạm Minh Thư	thu.pm@techcombank.com.vn	0988111333	NEW	2026-08-20 15:46:45.841	2026-08-20 16:57:38.023
j-fpt-2	e-fpt	Cộng tác viên Kiểm thử phần mềm (Part-time)	CTV	10	Thực hiện test case thủ công cho các dự án outsourcing.	Có thể làm 20h/tuần, cẩn thận.	Công nghệ thông tin	Làm việc từ xa	40,000đ/giờ	2026-08-17 16:57:38.02	Nguyễn Thị Hoàng Yến	yen_n_hoang@fsoft.com.vn	\N	CLOSED	2026-08-20 15:46:45.842	2026-08-20 16:57:38.024
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", title, content, type, "isRead", link, "createdAt") FROM stdin;
n-1	u-an	MOU sắp hết hiệu lực	Văn bản 15/MOU-HUST-VNG với VNG Corp sắp đến hạn, cần liên hệ tái ký.	MOU_EXPIRY	f	/mous	2026-08-20 15:46:45.86
n-2	u-dung	Công việc đến hạn hôm nay	Gọi điện nhắc lại thư mời hợp tác VNPT.	TASK_DUE	f	/tasks	2026-08-20 15:46:45.862
n-3	u-dung	Nhắc theo dõi tương tác	Techcombank đang chờ hồ sơ giới thiệu nhà trường.	INTERACTION_REMINDER	f	/enterprises	2026-08-20 15:46:45.862
n-4	u-admin	Hệ thống đã sẵn sàng	Dữ liệu khởi tạo đã được nạp đầy đủ. Vui lòng đổi mật khẩu mặc định sau lần đăng nhập đầu tiên.	SYSTEM	f	\N	2026-08-20 15:46:45.863
n-5	u-minh	Công việc được giao	Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G.	TASK_DUE	t	/tasks	2026-08-20 15:46:45.863
\.


--
-- Data for Name: partnership_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partnership_documents (id, code, type, "enterpriseId", "departmentId", "signDate", "effectiveDate", "expiryDate", "picId", content, status, "fileUrl", "createdAt", "updatedAt") FROM stdin;
mou-fpt	12/2025/MOU-HUST-FPT	MOU	e-fpt	d-qhdn	2025-05-10 00:00:00	2025-05-10 00:00:00	2027-05-10 00:00:00	u-an	Hợp tác đào tạo thực hành, tiếp nhận 150 thực tập sinh/năm.	DA_KY	/files/mou_hust_fpt_signed.pdf	2026-08-20 15:46:45.831	2026-08-20 16:57:38.016
mou-viettel	09/2026/MOU-HUST-VIETTEL	MOU	e-viettel	d-qhdn	2026-03-01 00:00:00	2026-03-01 00:00:00	2029-03-01 00:00:00	u-an	Nghiên cứu chung AI & Mạng viễn thông, trao học bổng.	DA_KY	/files/mou_hust_viettel_signed.pdf	2026-08-20 15:46:45.834	2026-08-20 16:57:38.018
mou-vng	15/MOU-HUST-VNG	MOU	e-vng	d-qhdn	2024-08-15 00:00:00	2024-08-15 00:00:00	2026-08-15 00:00:00	u-dung	Cung cấp hạ tầng số thử nghiệm, đào tạo AI/Cloud.	DA_KY	\N	2026-08-20 15:46:45.835	2026-08-20 16:57:38.018
mou-tcb-draft	21/2026/MOU-HUST-TCB	MOU	e-tcb	d-ktql	2026-09-19 16:57:38.015	2026-09-19 16:57:38.015	2028-09-18 16:57:38.015	u-dung	Dự thảo hợp tác cấp học bổng và tiếp nhận thực tập khối Kinh tế.	SOAN_THAO	\N	2026-08-20 15:46:45.836	2026-08-20 16:57:38.019
mou-vnpt-review	22/2026/MOA-HUST-VNPT	MOA	e-vnpt	d-dtvt	2026-09-04 16:57:38.015	2026-09-04 16:57:38.015	2029-09-03 16:57:38.015	u-dung	Thỏa thuận phối hợp đào tạo kỹ năng số, đang trình Ban Giám hiệu ký.	TRINH_KY	\N	2026-08-20 15:46:45.836	2026-08-20 16:57:38.02
mou-abc-expired	05/2023/MOU-HUST-ABC	CONTRACT	e-oldpartner	d-ktql	2023-03-01 00:00:00	2023-03-01 00:00:00	2025-03-01 00:00:00	u-dung	Hợp đồng nguyên tắc đã hết hiệu lực, lưu hồ sơ tra cứu.	HET_HAN	\N	2026-08-20 15:46:45.837	2026-08-20 16:57:38.02
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, code, "group", "createdAt", "updatedAt") FROM stdin;
p1	Xem tất cả doanh nghiệp	view_all_enterprises	ENTERPRISE	2026-08-20 15:46:45.523	2026-08-20 16:57:37.723
p2	Xem doanh nghiệp được gán	view_assigned_enterprises	ENTERPRISE	2026-08-20 15:46:45.525	2026-08-20 16:57:37.724
p3	Tạo doanh nghiệp mới	create_enterprise	ENTERPRISE	2026-08-20 15:46:45.526	2026-08-20 16:57:37.725
p4	Chỉnh sửa doanh nghiệp	edit_enterprise	ENTERPRISE	2026-08-20 15:46:45.527	2026-08-20 16:57:37.725
p5	Xóa doanh nghiệp	delete_enterprise	ENTERPRISE	2026-08-20 15:46:45.528	2026-08-20 16:57:37.726
p6	Quản lý người liên hệ	manage_contacts	CONTACT	2026-08-20 15:46:45.528	2026-08-20 16:57:37.726
p7	Quản lý nhật ký tương tác	manage_interactions	INTERACTION	2026-08-20 15:46:45.529	2026-08-20 16:57:37.726
p8	Quản lý thỏa thuận MOU	manage_mou	MOU	2026-08-20 15:46:45.529	2026-08-20 16:57:37.727
p9	Quản lý tin tuyển dụng	manage_jobs	JOB	2026-08-20 15:46:45.53	2026-08-20 16:57:37.727
p10	Quản lý sự kiện hợp tác	manage_events	EVENT	2026-08-20 15:46:45.53	2026-08-20 16:57:37.728
p11	Xem Dashboard tổng quan	view_dashboard	DASHBOARD	2026-08-20 15:46:45.531	2026-08-20 16:57:37.728
p12	Quản lý người dùng hệ thống	manage_users	ADMIN	2026-08-20 15:46:45.531	2026-08-20 16:57:37.729
p13	Quản lý danh mục chung	manage_master_data	ADMIN	2026-08-20 15:46:45.532	2026-08-20 16:57:37.729
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
r-admin	Super Admin	SUPER_ADMIN	Quản trị viên toàn hệ thống và phân quyền	2026-08-20 15:46:45.513	2026-08-20 16:57:37.715
r-leader	Lãnh đạo / Ban Giám hiệu	LEADER	Xem báo cáo, KPIs, giám sát hợp tác	2026-08-20 15:46:45.52	2026-08-20 16:57:37.72
r-qhdn-mgr	Quản trị phòng QHDN	QHDN_MANAGER	Duyệt dữ liệu, điều phối cán bộ phòng QHDN	2026-08-20 15:46:45.52	2026-08-20 16:57:37.72
r-qhdn-staff	Chuyên viên QHDN	QHDN_STAFF	Cập nhật trực tiếp thông tin doanh nghiệp, MOU, liên hệ	2026-08-20 15:46:45.521	2026-08-20 16:57:37.721
r-faculty	Cán bộ đại diện Khoa	FACULTY_REPRESENTATIVE	Quản lý hợp tác liên quan trực tiếp đến khoa	2026-08-20 15:46:45.522	2026-08-20 16:57:37.722
r-student	Trung tâm Hỗ trợ SV	STUDENT_SUPPORT	Quản lý tuyển dụng, thực tập, sự kiện việc làm	2026-08-20 15:46:45.522	2026-08-20 16:57:37.722
r-startup	Trung tâm Đổi mới Sáng tạo	INNOVATION_CENTER	Đồng hành khởi nghiệp, tài trợ đề án	2026-08-20 15:46:45.523	2026-08-20 16:57:37.723
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, "dueDate", status, priority, "enterpriseId", "interactionId", "assigneeId", "creatorId", "createdAt", "updatedAt") FROM stdin;
t-1	Lời mời anh Hưng họp góp ý CTĐT Điện tử	Hẹn lịch họp tại khoa DTVT.	2026-08-21 16:57:38.031	TODO	HIGH	e-viettel	\N	u-an	u-dung	2026-08-20 16:09:18.176	2026-08-20 16:57:38.033
t-3	Theo dõi gia hạn văn bản MOU với VNG	MOU hết hạn 15/08/2026, liên hệ tái ký.	2026-09-04 16:57:38.031	TODO	HIGH	e-vng	\N	u-dung	u-dung	2026-08-20 15:46:45.855	2026-08-20 16:57:38.033
t-4	Gửi bộ hồ sơ giới thiệu nhà trường cho Techcombank	Kèm đề xuất quỹ học bổng Khoa KTQL.	2026-08-22 16:57:38.031	IN_PROGRESS	MEDIUM	e-tcb	i-tcb-1	u-dung	u-dung	2026-08-20 15:46:45.856	2026-08-20 16:57:38.034
t-5	Gọi điện nhắc lại thư mời hợp tác VNPT	Đã gửi đề xuất 8 ngày trước, chưa có phản hồi.	2026-08-21 16:57:38.031	TODO	MEDIUM	e-vnpt	i-vnpt-1	u-dung	u-admin	2026-08-20 16:09:18.18	2026-08-20 16:57:38.035
t-6	Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G	Gửi cho đầu mối Viettel sau sự kiện.	2026-08-23 16:57:38.031	TODO	LOW	e-viettel	i-viettel-2	u-minh	u-dung	2026-08-20 15:46:45.857	2026-08-20 16:57:38.035
t-7	Chuẩn bị đề xuất nhu cầu hạ tầng Cloud cho phòng Lab AI	Tổng hợp cấu hình và dự toán credit cần VNG tài trợ.	2026-08-25 16:57:38.031	IN_PROGRESS	HIGH	e-vng	i-vng-1	u-an	u-dung	2026-08-20 15:46:45.858	2026-08-20 16:57:38.036
t-8	Tổng hợp danh sách sinh viên đăng ký Ngày hội việc làm 2026	Phối hợp Trung tâm Hỗ trợ SV mở đơn đăng ký.	2026-09-01 16:57:38.031	TODO	HIGH	\N	\N	u-an	u-admin	2026-08-20 15:46:45.859	2026-08-20 16:57:38.036
t-9	Gửi danh sách sinh viên thực tập đợt 1 cho FPT	Đã hoàn thành và được đối tác xác nhận.	2026-08-15 16:57:38.031	COMPLETED	MEDIUM	e-fpt	i-fpt-1	u-an	u-dung	2026-08-20 16:09:18.183	2026-08-20 16:57:38.037
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", "fullName", phone, "isActive", "departmentId", "roleId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
u-admin	admin@hust.edu.vn	$2b$10$R7epV14CX.KilqMAL1rO6e3GBeNfloqmd74zCsOAmseGT2J9ttcSO	Nguyễn Văn Admin	0901234567	t	d-qhdn	r-admin	2026-08-20 15:46:45.592	2026-08-20 16:57:37.785	\N
u-leader	bgh.hai@hust.edu.vn	$2b$10$C6kjUTbqsKuuADzZY5yJceEsZdvRkx24esrcmNtlsrrKWYSzgd3Dy	PGS. TS. Trần Đức Hải	0987654321	t	\N	r-leader	2026-08-20 15:46:45.645	2026-08-20 16:57:37.835	\N
u-dung	qhdn.dung@hust.edu.vn	$2b$10$Niv5LHEfvQBhmNYnJk3bpuuRhdi4dUrGkkBmjf03IEZ62.e3GZZm6	ThS. Hoàng Trung Dũng	0912345678	t	d-qhdn	r-qhdn-mgr	2026-08-20 15:46:45.695	2026-08-20 16:57:37.884	\N
u-an	qhdn.an@hust.edu.vn	$2b$10$sz2lRAooSLv.08xr8LSa.eMk2P7FvAv0l/MbxT1sEhxY5TkhO3zeq	CN. Lê Hoài An	0934567890	t	d-qhdn	r-qhdn-staff	2026-08-20 15:46:45.745	2026-08-20 16:57:37.934	\N
u-minh	cntt.minh@hust.edu.vn	$2b$10$1lNslx85d5hcRf0JPS7HP.JMyMA3vkwpmsZ.1MZlx3apPtUgfZ2l2	TS. Nguyễn Khánh Minh	0945678901	t	d-cntt	r-faculty	2026-08-20 15:46:45.795	2026-08-20 16:57:37.983	\N
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


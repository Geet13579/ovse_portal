
import { authorizedFetch } from "@/app/lib/api-client";

export type ApiUser = {
  id: number | string;
  name: string;
  email: string;
  role?: string | null;
  user_scope?: string | number | null;
  is_active?: boolean | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function displayScope(
  scope: ApiUser["user_scope"]
): string {
  if (scope === null || scope === undefined || scope === "") {
    return "—";
  }

  return String(scope);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB");
}

async function readResponse(response: Response) {
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.status === false) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Request failed (${response.status}).`
    );
  }

  return result;
}

export async function fetchAdminUsers(): Promise<ApiUser[]> {
  const response = await authorizedFetch("/api/admin/users", {
    method: "GET",
  });

  const result = await readResponse(response);

  const users = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.users)
      ? result.users
      : Array.isArray(result.data?.users)
        ? result.data.users
        : null;

  if (!users) {
    throw new Error("Unexpected users API response format.");
  }

  return users as ApiUser[];
}

export async function updateAdminUser(
  id: number | string,
  payload: {
    name: string;
    email: string;
    user_scope: string;
  }
) {
  const response = await authorizedFetch(
    `/api/admin/update-user/${encodeURIComponent(String(id))}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return readResponse(response);
}

export async function deleteAdminUser(id: number | string) {
  const response = await authorizedFetch(
    `/api/admin/user/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );

  return readResponse(response);
}

export interface VisitorData {
  day: string;
  visitors: number;
}

export interface DashboardData {
  totalVisitors: number;
  in: number;
  out: number;
  failedAuth: number;
  graph: VisitorData[];
}

interface DashboardApiResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: {
    totalVisitors?: number | string;
    in?: number | string;
    out?: number | string;
    failedAuth?: number | string;
    graph?: unknown;
    graphData?: unknown;
  };
}

export async function fetchDashboardData(
  userId: number | string,
  endpoint: string
): Promise<DashboardData> {
  if (userId === "" || userId === null || userId === undefined) {
    throw new Error("User ID is required.");
  }

  const response = await authorizedFetch(
    `${endpoint}/${encodeURIComponent(String(userId))}`,
    {
      method: "GET",
    }
  );

  const result = (await response.json().catch(() => null)) as
    | DashboardApiResponse
    | null;

  if (!response.ok || !result?.status || !result.data) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Dashboard request failed (${response.status}).`
    );
  }

  const data = result.data;

  const rawGraph = Array.isArray(data.graph)
    ? data.graph
    : Array.isArray(data.graphData)
      ? data.graphData
      : [];

  const graph: VisitorData[] = rawGraph
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => {
      const count = Number(item.visitors);

      return {
        day: String(item.day ?? ""),
        visitors: Number.isFinite(count)
          ? Math.max(0, count)
          : 0,
      };
    })
    .filter((item) => item.day !== "");

  return {
    totalVisitors: Number(data.totalVisitors ?? 0),
    in: Number(data.in ?? 0),
    out: Number(data.out ?? 0),
    failedAuth: Number(data.failedAuth ?? 0),
    graph,
  };
}


export async function fetchUserDashboardData(
  userId: number | string,
  endpoint: string
): Promise<DashboardData> {


  const response = await authorizedFetch(
    `${endpoint}`,
    {
      method: "GET",
    }
  );

  const result = (await response.json().catch(() => null)) as
    | DashboardApiResponse
    | null;

  if (!response.ok || !result?.status || !result.data) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Dashboard request failed (${response.status}).`
    );
  }

  const data = result.data;

  const rawGraph = Array.isArray(data.graph)
    ? data.graph
    : Array.isArray(data.graphData)
      ? data.graphData
      : [];

  const graph: VisitorData[] = rawGraph
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => {
      const count = Number(item.visitors);

      return {
        day: String(item.day ?? ""),
        visitors: Number.isFinite(count)
          ? Math.max(0, count)
          : 0,
      };
    })
    .filter((item) => item.day !== "");

  return {
    totalVisitors: Number(data.totalVisitors ?? 0),
    in: Number(data.in ?? 0),
    out: Number(data.out ?? 0),
    failedAuth: Number(data.failedAuth ?? 0),
    graph,
  };
}
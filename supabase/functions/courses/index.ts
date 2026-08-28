import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VALID_STATUSES = ["Not Started", "In Progress", "Completed"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Route: /courses/{id}  (id optional)
function parseId(url: string): string | null {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  // /functions/v1/courses/{id}  => ["functions","v1","courses",id?]
  const idx = parts.indexOf("courses");
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return parts[idx + 1];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const id = parseId(req.url);
    const method = req.method;

    if (method === "GET") {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (method === "POST") {
      const body = await req.json();
      const { name, description, target_date, status } = body;
      if (!name || !description || !target_date) {
        return json(
          { error: "name, description, and target_date are required" },
          400,
        );
      }
      const finalStatus = status || "Not Started";
      if (!VALID_STATUSES.includes(finalStatus)) {
        return json({ error: "Invalid status value" }, 400);
      }
      const { data, error } = await supabase
        .from("courses")
        .insert({ name, description, target_date, status: finalStatus })
        .select()
        .single();
      if (error) throw error;
      return json(data, 201);
    }

    if (method === "PUT") {
      if (!id) return json({ error: "Course id required" }, 400);
      const body = await req.json();
      const update: Record<string, unknown> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.description !== undefined) update.description = body.description;
      if (body.target_date !== undefined) update.target_date = body.target_date;
      if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) {
          return json({ error: "Invalid status value" }, 400);
        }
        update.status = body.status;
      }
      if (Object.keys(update).length === 0) {
        return json({ error: "No fields to update" }, 400);
      }
      const { data, error } = await supabase
        .from("courses")
        .update(update)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Course not found" }, 404);
      return json(data);
    }

    if (method === "DELETE") {
      if (!id) return json({ error: "Course id required" }, 400);
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

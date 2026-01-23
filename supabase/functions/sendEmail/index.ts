import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  payload?: any, // 🔥 NEW
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not found in environment");
    throw new Error("RESEND_API_KEY is not configured");
  }

  console.log("✅ RESEND_API_KEY found");
  console.log("📧 Attempting to send email");
  console.log("   To:", to);
  console.log("   From: support@infofixcomputer.in");
  console.log("   Subject:", subject);
  const emailPayload: any = {
    from: "Infofix Services <support@infofixcomputer.in>",
    to,
    subject,
    html,
  };

  // Attach PDF if provided
  if ((payload as any)?.attachment?.base64) {
    emailPayload.attachments = [
      {
        filename: (payload as any).attachment.fileName,
        content: (payload as any).attachment.base64,
        content_type: "application/pdf",
      },
    ];
  }

  console.log("📤 Email payload:", JSON.stringify(emailPayload, null, 2));

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  const responseText = await response.text();
  console.log("📥 Resend API status:", response.status);
  console.log("📥 Resend API response:", responseText);

  if (!response.ok) {
    console.error("❌ Email sending failed");
    throw new Error(`Resend API error: ${responseText}`);
  }

  console.log("✅ Email sent successfully");
  return JSON.parse(responseText);
}

serve(async (req: Request) => {
  console.log("🚀 Edge function invoked");
  console.log("   Method:", req.method);
  console.log("   URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight");
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.json();
    console.log("📨 Request body received:", JSON.stringify(body, null, 2));

    const { type, payload, user } = body;

    if (type === "TICKET_CREATED") {
      const {
        ticketId,
        customerName,
        customerEmail,
        issueDescription,
        priority,
        source,
      } = payload;

      console.log("🎫 Processing TICKET_CREATED event");
      console.log("   Ticket ID:", ticketId);
      console.log("   Customer:", customerName, customerEmail);

      // Send email to customer
      console.log("📧 Sending customer notification...");
      console.log("📧 Sending customer notification...");

      //  DIFFERENT EMAIL BASED ON WHO CREATED TICKET
      if (source === "CUSTOMER") {
        await sendEmail(
          customerEmail,
          `Request Received: ${ticketId}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #4F46E5;">Service Request Submitted</h2>
       <p>Hello <strong>${customerName}</strong>,</p>
       <p>We have successfully received your service request.</p>

       <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p><strong>Ticket ID:</strong> ${ticketId}</p>
         <p><strong>Issue:</strong> ${issueDescription}</p>
         <p><strong>Status:</strong> Pending Approval</p>
       </div>

       <p>Your request is currently under review by our team.</p>
       <p>Once approved, you will receive another update.</p>

       <p style="margin-top: 30px;">
         Thank you,<br/>
         <strong>InfoFix Support Team</strong>
       </p>
     </div>`,
          payload,
        );
      } else {
        // ===== STAFF TEMPLATE (YOUR EXISTING ONE - UNCHANGED) =====
        await sendEmail(
          customerEmail,
          `Ticket Created: ${ticketId}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #4F46E5;">Ticket Created Successfully</h2>
       <p>Hello <strong>${customerName}</strong>,</p>
       <p>Your support ticket has been created with the following details:</p>
       <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p><strong>Ticket ID:</strong> ${ticketId}</p>
         <p><strong>Issue:</strong> ${issueDescription}</p>
         <p><strong>Priority:</strong> ${priority}</p>
       </div>
       <p>Our team will review your ticket and get back to you shortly.</p>
       <p style="margin-top: 30px;">Thank you,<br/><strong>Infofix Support Team</strong></p>
     </div>`,
          payload,
        );
      }

      // Send email to technician if assigned
      if (user?.email && source !== "CUSTOMER") {
        console.log("👷 Sending technician notification to:", user.email);
        await sendEmail(
          user.email,
          `New Ticket Assigned: ${ticketId}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2 style="color: #4F46E5;">New Ticket Assigned</h2>
             <p>Hello <strong>${user.name}</strong>,</p>
             <p>A new ticket has been assigned to you:</p>
             <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
               <p><strong>Ticket ID:</strong> ${ticketId}</p>
               <p><strong>Customer:</strong> ${customerName}</p>
               <p><strong>Issue:</strong> ${issueDescription}</p>
               <p><strong>Priority:</strong> ${priority}</p>
             </div>
             <p>Please check the system and update the ticket status accordingly.</p>
             <p style="margin-top: 30px;">Thanks,<br/><strong>Infofix Support Team</strong></p>
           </div>`,
          payload,
        );
      }
    }

    if (type === "TASK_ASSIGNED") {
      const { taskId, title, description, priority } = payload;

      console.log("📋 Processing TASK_ASSIGNED event");
      console.log("   Task ID:", taskId);

      if (user?.email) {
        console.log("👷 Sending task assignment to:", user.email);
        await sendEmail(
          user.email,
          `New Task Assigned: ${taskId}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2 style="color: #4F46E5;">New Task Assigned</h2>
             <p>Hello <strong>${user.name}</strong>,</p>
             <p>A new task has been assigned to you:</p>
             <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
               <p><strong>Task ID:</strong> ${taskId}</p>
               <p><strong>Title:</strong> ${title}</p>
               <p><strong>Description:</strong> ${description}</p>
               <p><strong>Priority:</strong> ${priority}</p>
             </div>
             <p>Please start working on it as soon as possible.</p>
             <p style="margin-top: 30px;">Thanks,<br/><strong>InfoFix Support Team</strong></p>
           </div>`,
        );
      }
    }

    console.log("✅ All emails sent successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("❌ Error in edge function:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error message:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

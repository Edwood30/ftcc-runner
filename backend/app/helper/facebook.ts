import { env } from "../configuration/env.js";

export interface FacebookPublishResult {
  status: "posted" | "skipped" | "failed";
  message: string;
  postId?: string;
}

function hasPublicAssetBaseUrl(): boolean {
  try {
    const { hostname } = new URL(env.APP_BASE_URL);
    return !["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

async function postGraphForm(endpoint: string, body: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Facebook Graph API request failed.");
  }

  return payload;
}

export async function publishMissionToFacebook(caption: string, imageUrls: string[]): Promise<FacebookPublishResult> {
  if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return {
      status: "skipped",
      message: "Facebook posting is skipped until FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are configured.",
    };
  }

  if (!hasPublicAssetBaseUrl()) {
    return {
      status: "skipped",
      message: "Facebook posting is skipped because APP_BASE_URL must be a public URL, not localhost.",
    };
  }

  try {
    const apiRoot = `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/${env.FACEBOOK_PAGE_ID}`;
    const mediaIds: string[] = [];

    for (const imageUrl of imageUrls) {
      const uploadPayload = new URLSearchParams({
        url: imageUrl,
        published: "false",
        access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN,
      });
      const uploadResult = await postGraphForm(`${apiRoot}/photos`, uploadPayload);
      const mediaId = String(uploadResult.id ?? "");
      if (!mediaId) {
        throw new Error("Facebook did not return an uploaded media id.");
      }
      mediaIds.push(mediaId);
    }

    const feedPayload = new URLSearchParams({
      message: caption,
      access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN,
    });
    mediaIds.forEach((mediaId, index) => {
      feedPayload.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: mediaId }));
    });

    const feedResult = await postGraphForm(`${apiRoot}/feed`, feedPayload);

    return {
      status: "posted",
      message: "Posted to Facebook successfully.",
      postId: String(feedResult.id ?? ""),
    };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Facebook posting failed.",
    };
  }
}

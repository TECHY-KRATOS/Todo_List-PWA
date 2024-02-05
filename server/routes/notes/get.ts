import { HandlerEvent, HandlerResponse } from "@netlify/functions";

import { Filter } from "firebase-admin/firestore";
import {
  ValiError,
  custom,
  object,
  optional,
  parse,
  picklist,
  string,
} from "valibot";
import { admin } from "../../firebase/admin";
import { getFirebaseErrorMessage } from "../../utils/format-firebase-error";
import { getHeaders } from "../../utils/get-headers";
import { isFirebaseError } from "../../utils/is-firebase-error";
import {
  AuthorizationError,
  verifyFirebaseToken,
} from "../../utils/validate-user";

const queryParamsSchema = object(
  {
    user: string("User is not specified"),
    field: optional(
      picklist(["text", "category"], "field can be either text or category"),
    ),
    q: optional(string("query text is required")),
  },
  [
    custom(({ field, q }) => {
      // if both undefined then PASS
      if (!field && !q) return true;

      // if both defined then a then pass
      if (field && q) return true;

      return false;
    }, "'field' and 'q' both query params are required"),

    custom(({ field, q }) => {
      // if both undefined then PASS
      if (!field && !q) return true;

      if (field === "text") return true;

      if (field === "category" && (q === "general" || q === "important"))
        return true;

      return false;
    }, "'q' must be general or important"),

    custom(({ field, q }) => {
      // if both undefined then PASS
      if (!field && !q) return true;

      if (field === "category") return true;

      return false;
    }, "text query is not supported at this moment"),
  ],
);

export default async function GET(
  event: HandlerEvent,
): Promise<HandlerResponse> {
  try {
    const queryParams = parse(queryParamsSchema, event.queryStringParameters);

    const token = event.headers["authorization"]?.split(" ")?.[1];

    const user = await verifyFirebaseToken({
      uid: queryParams.user,
      token,
    });

    let filter = Filter.or(
      Filter.where("userId", "==", user.uid),
      Filter.where("sharedWith", "array-contains-any", [user.uid, user.email]),
    );

    if (
      queryParams.field &&
      queryParams.q &&
      queryParams.field === "category"
    ) {
      filter = Filter.and(
        Filter.where("userId", "==", user.uid),
        Filter.where(queryParams.field, "==", queryParams.q),
      );
    }

    const data = await admin()
      .firestore()
      .collection("notes")
      .where(filter)
      .orderBy("updatedAt", "desc")
      .get();

    const notes = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      statusCode: 200,
      body: JSON.stringify(notes),
      headers: getHeaders("application/json"),
    };
  } catch (error: unknown) {
    console.log("🚀 ~ error:", error);
    if (error instanceof ValiError) {
      return {
        statusCode: 400,
        body: error.issues[0].message,
        headers: getHeaders(),
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        statusCode: 401,
        body: error.message,
        headers: getHeaders(),
      };
    }

    if (isFirebaseError(error)) {
      const message = getFirebaseErrorMessage(error.code);
      return {
        statusCode: message.toLocaleLowerCase().startsWith("something")
          ? 500
          : 400,
        body: message,
        headers: getHeaders(),
      };
    }

    return {
      statusCode: 500,
      body: "Something went wrong",
      headers: getHeaders(),
    };
  }
}

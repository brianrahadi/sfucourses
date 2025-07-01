import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const type = req.query.type;
  try {
    if (type === "revalidate-explore") {
      await res.revalidate("/explore");
      return res.json({ revalidated: true, page: "/explore" });
    } else if (type === "revalidate-schedule") {
      await res.revalidate("/schedule");
      return res.json({ revalidated: true, page: "/schedule" });
    } else if (type === "revalidate-instructors") {
      await res.revalidate("/instructors");
      return res.json({ revalidated: true, page: "/instructors" });
    } else {
      return res.status(400).json({ message: "Invalid revalidate type" });
    }
  } catch (err) {
    return res.status(500).send("Error revalidating");
  }
}

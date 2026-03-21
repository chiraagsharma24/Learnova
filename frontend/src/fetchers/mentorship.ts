import { api, extractData } from "./request";

export type MentorSuggestion = {
  userId: string;
  name: string;
  level: number;
  levelName: string;
  isMentor: boolean;
  openSlots: number;
};

export type MentorshipNetwork = {
  myMentor: { userId: string; name: string; level: number; levelName: string } | null;
  myMentees: { userId: string; name: string; level: number; levelName: string }[];
  isMentor: boolean;
  canBecomeMentor: boolean;
};

export const fetchMentorshipSuggestions = () =>
  api.get("/api/mentorship/suggestions").then(extractData) as Promise<{
    suggestions: MentorSuggestion[];
  }>;

export const fetchMentorshipNetwork = () =>
  api.get("/api/mentorship/network").then(extractData) as Promise<MentorshipNetwork>;

export const becomeMentor = () =>
  api.post("/api/mentorship/become-mentor").then(extractData);

export const connectToMentor = (mentorUserId: string) =>
  api.post("/api/mentorship/connect", { mentorUserId }).then(extractData);

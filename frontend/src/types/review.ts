export interface Review {
  _id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

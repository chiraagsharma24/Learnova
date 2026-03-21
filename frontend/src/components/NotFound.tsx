import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function NotFound() {
  return (
    <div className="flex gap-6">
      <h2>Not Found</h2>
      <Link to={"/"}>
        <Button asChild>Go to Home</Button>
      </Link>
    </div>
  );
}

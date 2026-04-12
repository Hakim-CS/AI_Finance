import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">Loading user profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="p-8 text-center text-destructive">
        <CardTitle>Error</CardTitle>
        <CardDescription>User not logged in or data not available.</CardDescription>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Email:</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          {user.name && (
            <div>
              <h3 className="text-lg font-semibold">Full Name:</h3>
              <p className="text-muted-foreground">{user.name}</p>
            </div>
          )}
          {user.username && (
            <div>
              <h3 className="text-lg font-semibold">Username:</h3>
              <p className="text-muted-foreground">{user.username}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">User ID:</h3>
            <p className="text-muted-foreground">{user.id}</p>
          </div>
          {/* Add more user details or editing options here */}
        </CardContent>
      </Card>
    </div>
  );
}
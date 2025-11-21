import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-sm">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-slate-600">
              Please check your email and click the confirmation link to activate your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

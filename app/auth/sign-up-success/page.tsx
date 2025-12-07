import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

export default function SignUpSuccessPage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-14 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 lg:px-[27px]">
          <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
            <Image
              src="/images/logo-text.png"
              alt="Seoul Founders Club"
              width={120}
              height={24}
              className="h-6 w-auto object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-20">
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
    </>
  );
}

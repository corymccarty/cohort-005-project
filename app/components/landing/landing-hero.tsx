import { Link } from "react-router";
import { ArrowRight, BookOpen, Check, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CourseImage } from "~/components/course-image";
import type { FeaturedCourse } from "~/modules/landing/index.server";

const PROMISES = [
  "Structured modules, lesson by lesson",
  "Quizzes that check what stuck",
  "Progress saved wherever you stop",
];

export function LandingHero({
  signedIn,
  spotlight,
}: {
  signedIn: boolean;
  spotlight: FeaturedCourse | null;
}) {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Courses for working developers
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Learn to code,
            <br />
            <span className="text-muted-foreground">at your own pace</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Structured courses built by experienced instructors. Track your
            progress, take quizzes, and build real-world skills.
          </p>
          <HeroActions signedIn={signedIn} />
          <ul className="mt-10 space-y-2 text-sm text-muted-foreground">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                {promise}
              </li>
            ))}
          </ul>
        </div>
        {spotlight && <SpotlightCard course={spotlight} />}
      </div>
    </section>
  );
}

function HeroActions({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <Button asChild size="lg">
        <Link to="/courses">
          Browse Courses
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        {signedIn ? (
          <Link to="/dashboard">Go to your dashboard</Link>
        ) : (
          <Link to="/signup">Create a free account</Link>
        )}
      </Button>
    </div>
  );
}

function SpotlightCard({ course }: { course: FeaturedCourse }) {
  return (
    <div className="relative isolate">
      <div className="absolute -inset-4 -z-10 rotate-3 rounded-2xl bg-primary/10" />
      <Link
        to={`/courses/${course.slug}`}
        className="group block overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-shadow hover:shadow-2xl"
      >
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <div className="space-y-3 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            New · {course.categoryName}
          </p>
          <h2 className="text-xl font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {course.instructorName}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {course.lessonCount} lessons
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

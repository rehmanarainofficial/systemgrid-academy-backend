import 'reflect-metadata';
import { config } from 'dotenv';
import {
  getModuleDescription,
  getTopicDescription,
  normalizeOutlineKey,
} from '../src/database/seeds/course-outline-copy';

config();

type ModuleSeed = { title: string; topics: string[] };
type QuarterSeed = { modules: ModuleSeed[] };
type CourseSeed = { slug: string; title: string; quarters: QuarterSeed[] };

const PLACEHOLDER_PATTERNS = [
  /mini-?sprint/i,
  /students learn what/i,
  /apply the quarter skills in a guided project/i,
  /turns .* into a practical mini-sprint/i,
];

import { courses } from '../src/database/seeds/course-outlines.seed';

function isPlaceholder(text: string) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(text));
}

async function main() {
  const courseSeeds = courses;
  const issues: string[] = [];
  let moduleTotal = 0;
  let topicTotal = 0;
  let moduleMissing = 0;
  let topicMissing = 0;
  let placeholderHits = 0;

  for (const course of courseSeeds) {
    for (const [quarterIndex, quarter] of course.quarters.entries()) {
      for (const [moduleIndex, moduleSeed] of quarter.modules.entries()) {
        moduleTotal += 1;
        const moduleDescription = getModuleDescription(
          course.slug,
          quarterIndex,
          moduleIndex,
          moduleSeed.title,
        );
        if (!moduleDescription) {
          moduleMissing += 1;
          issues.push(
            `MISSING_MODULE | ${course.slug} | Q${quarterIndex + 1} M${moduleIndex + 1} | ${moduleSeed.title}`,
          );
        } else if (isPlaceholder(moduleDescription)) {
          placeholderHits += 1;
          issues.push(
            `PLACEHOLDER_MODULE | ${course.slug} | ${moduleSeed.title} | ${moduleDescription.slice(0, 80)}`,
          );
        }

        for (const topicTitle of moduleSeed.topics) {
          topicTotal += 1;
          const topicDescription = getTopicDescription(
            course.slug,
            topicTitle,
            moduleSeed.title,
            quarterIndex,
            moduleIndex,
          );
          if (!topicDescription) {
            topicMissing += 1;
            issues.push(
              `MISSING_TOPIC | ${course.slug} | ${normalizeOutlineKey(topicTitle)} | ${topicTitle}`,
            );
          } else if (isPlaceholder(topicDescription)) {
            placeholderHits += 1;
            issues.push(
              `PLACEHOLDER_TOPIC | ${course.slug} | ${topicTitle} | ${topicDescription.slice(0, 80)}`,
            );
          }
        }
      }
    }
  }

  console.log(`COURSES=${courseSeeds.length}`);
  console.log(`MODULES=${moduleTotal} MISSING=${moduleMissing}`);
  console.log(`TOPICS=${topicTotal} MISSING=${topicMissing}`);
  console.log(`PLACEHOLDER_HITS=${placeholderHits}`);
  console.log(`ISSUES=${issues.length}`);

  if (issues.length > 0) {
    console.log('\n--- First 40 issues ---');
    for (const issue of issues.slice(0, 40)) {
      console.log(issue);
    }
    if (issues.length > 40) {
      console.log(`... and ${issues.length - 40} more`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

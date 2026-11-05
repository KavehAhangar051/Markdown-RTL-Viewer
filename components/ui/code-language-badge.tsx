'use client';

/**
 * @file components/ui/code-language-badge.tsx
 * @description Official programming language logo badge for code block headers using authentic Devicon brand emblems.
 */

import React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { FileText, Settings, Code2 } from '@/components/animate-ui/icons';
import { normalizeLanguage } from '@/utils/syntaxHighlighter';

import javascriptLogo from 'devicon/icons/javascript/javascript-original.svg';
import typescriptLogo from 'devicon/icons/typescript/typescript-original.svg';
import reactLogo from 'devicon/icons/react/react-original.svg';
import pythonLogo from 'devicon/icons/python/python-original.svg';
import cplusplusLogo from 'devicon/icons/cplusplus/cplusplus-original.svg';
import csharpLogo from 'devicon/icons/csharp/csharp-original.svg';
import cLogo from 'devicon/icons/c/c-original.svg';
import goLogo from 'devicon/icons/go/go-original-wordmark.svg';
import rustLogo from 'devicon/icons/rust/rust-original.svg';
import javaLogo from 'devicon/icons/java/java-original.svg';
import kotlinLogo from 'devicon/icons/kotlin/kotlin-original.svg';
import swiftLogo from 'devicon/icons/swift/swift-original.svg';
import dartLogo from 'devicon/icons/dart/dart-original.svg';
import phpLogo from 'devicon/icons/php/php-original.svg';
import rubyLogo from 'devicon/icons/ruby/ruby-original.svg';
import sqlLogo from 'devicon/icons/azuresqldatabase/azuresqldatabase-original.svg';
import postgresqlLogo from 'devicon/icons/postgresql/postgresql-original.svg';
import mysqlLogo from 'devicon/icons/mysql/mysql-original.svg';
import sqliteLogo from 'devicon/icons/sqlite/sqlite-original.svg';
import bashLogo from 'devicon/icons/bash/bash-original.svg';
import powershellLogo from 'devicon/icons/powershell/powershell-original.svg';
import html5Logo from 'devicon/icons/html5/html5-original.svg';
import xmlLogo from 'devicon/icons/xml/xml-original.svg';
import css3Logo from 'devicon/icons/css3/css3-original.svg';
import sassLogo from 'devicon/icons/sass/sass-original.svg';
import jsonLogo from 'devicon/icons/json/json-original.svg';
import yamlLogo from 'devicon/icons/yaml/yaml-plain.svg';
import markdownLogo from 'devicon/icons/markdown/markdown-original.svg';
import dockerLogo from 'devicon/icons/docker/docker-original.svg';
import graphqlLogo from 'devicon/icons/graphql/graphql-plain.svg';
import gitLogo from 'devicon/icons/git/git-original.svg';
import cmakeLogo from 'devicon/icons/cmake/cmake-original.svg';

type SvgLogoSource = StaticImageData | string;

interface LanguageLogoSpec {
  readonly logo?: SvgLogoSource;
  readonly invertOnDark?: boolean;
  readonly lightBackingOnDark?: boolean;
  readonly fallbackIcon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
}

/** Direct raw-alias overrides for specific dialects that share a highlight.js grammar */
const RAW_ALIAS_LOGO_MAP: Record<string, LanguageLogoSpec> = {
  jsx: { logo: reactLogo },
  tsx: { logo: reactLogo },
  react: { logo: reactLogo },
  xml: { logo: xmlLogo },
  svg: { logo: xmlLogo },
  xhtml: { logo: xmlLogo },
  html: { logo: html5Logo },
  htm: { logo: html5Logo },
  postgres: { logo: postgresqlLogo },
  postgresql: { logo: postgresqlLogo },
  mysql: { logo: mysqlLogo },
  sqlite: { logo: sqliteLogo },
};

/** Official brand logos mapped by normalized highlight.js language identifier */
const NORMALIZED_LANGUAGE_LOGO_MAP: Record<string, LanguageLogoSpec> = {
  typescript: { logo: typescriptLogo },
  javascript: { logo: javascriptLogo },
  python: { logo: pythonLogo },
  cpp: { logo: cplusplusLogo },
  csharp: { logo: csharpLogo },
  c: { logo: cLogo },
  go: { logo: goLogo },
  rust: { logo: rustLogo, invertOnDark: true },
  java: { logo: javaLogo },
  kotlin: { logo: kotlinLogo },
  swift: { logo: swiftLogo },
  dart: { logo: dartLogo },
  php: { logo: phpLogo },
  ruby: { logo: rubyLogo },
  sql: { logo: sqlLogo },
  bash: { logo: bashLogo, lightBackingOnDark: true },
  powershell: { logo: powershellLogo },
  xml: { logo: html5Logo },
  css: { logo: css3Logo },
  scss: { logo: sassLogo },
  json: { logo: jsonLogo, lightBackingOnDark: true },
  yaml: { logo: yamlLogo, invertOnDark: true },
  markdown: { logo: markdownLogo, invertOnDark: true },
  dockerfile: { logo: dockerLogo },
  graphql: { logo: graphqlLogo },
  diff: { logo: gitLogo },
  makefile: { logo: cmakeLogo },
  ini: { fallbackIcon: Settings },
  text: { fallbackIcon: FileText },
};

function resolveLanguageLogoSpec(languageName: string): LanguageLogoSpec {
  const rawClean = (languageName || '').trim().toLowerCase();

  if (rawClean && Object.hasOwn(RAW_ALIAS_LOGO_MAP, rawClean)) {
    return RAW_ALIAS_LOGO_MAP[rawClean];
  }

  const norm = normalizeLanguage(rawClean) || 'text';

  if (Object.hasOwn(NORMALIZED_LANGUAGE_LOGO_MAP, norm)) {
    return NORMALIZED_LANGUAGE_LOGO_MAP[norm];
  }

  return { fallbackIcon: Code2 };
}

/**
 * Renders the authentic official logo of the programming language for a code block header.
 */
export function CodeLanguageBadge({
  languageName,
  isDark,
}: {
  languageName: string;
  isDark: boolean;
}): React.JSX.Element {
  const spec = resolveLanguageLogoSpec(languageName);

  const containerClass = spec.lightBackingOnDark && isDark
    ? 'bg-zinc-100/95 border-zinc-300/80 shadow-2xs'
    : isDark
      ? 'bg-zinc-950/85 border-zinc-800/85 text-zinc-400'
      : 'bg-white border-zinc-200/90 text-zinc-600 shadow-2xs';

  if (spec.logo) {
    const imgFilterClass = spec.invertOnDark
      ? isDark
        ? 'invert opacity-90'
        : 'opacity-85'
      : '';

    return (
      <span
        aria-hidden="true"
        className={`h-6 w-6 rounded-md border inline-flex items-center justify-center shrink-0 select-none ${containerClass}`}
      >
        <Image
          src={spec.logo}
          alt=""
          width={16}
          height={16}
          referrerPolicy="no-referrer"
          className={`w-4 h-4 object-contain pointer-events-none ${imgFilterClass}`.trim()}
        />
      </span>
    );
  }

  const FallbackIcon = spec.fallbackIcon || Code2;

  return (
    <span
      aria-hidden="true"
      className={`h-6 w-6 rounded-md border inline-flex items-center justify-center shrink-0 select-none ${containerClass}`}
    >
      <FallbackIcon className="w-3.5 h-3.5" aria-hidden="true" />
    </span>
  );
}


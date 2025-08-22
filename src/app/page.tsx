import Link from 'next/link'
import { ArrowRight, Code, Database, TestTube, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Build backends with
              <span className="text-blue-600"> natural language</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Describe your backend feature and get scaffolded APIs, database models, 
              tests, and deployment configs. Your AI-powered backend development workspace.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" className="flex items-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                See demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              From prompt to production-ready code
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Code className="h-5 w-5 flex-none text-blue-600" />
                  API Generation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">Generate REST API endpoints with proper routing, validation, and error handling.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <Database className="h-5 w-5 flex-none text-blue-600" />
                  Database Models
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">Auto-generate database schemas, migrations, and ORM models from your requirements.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <TestTube className="h-5 w-5 flex-none text-blue-600" />
                  Test Coverage
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">Comprehensive unit and integration tests generated automatically for your APIs.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              See it in action
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Watch how Forgeback transforms a simple description into production-ready backend code.
            </p>
          </div>
          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe your backend feature:
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                      "I need a REST API to manage todo tasks with CRUD operations, 
                      SQLite database, input validation, and comprehensive tests."
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">AI generates your code...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">API Routes</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                      GET /api/todos<br/>
                      POST /api/todos<br/>
                      PUT /api/todos/:id<br/>
                      DELETE /api/todos/:id
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Database Schema</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                      todos table<br/>
                      - id (PRIMARY KEY)<br/>
                      - title (TEXT)<br/>
                      - completed (BOOLEAN)
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tests</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                      ✓ Create todo<br/>
                      ✓ List todos<br/>
                      ✓ Update todo<br/>
                      ✓ Delete todo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to build faster?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-200">
              Join developers who are shipping backends 10x faster with AI-powered code generation.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  Start building now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
<script setup lang="ts">
const { authReady } = useAuthState()
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <div v-if="!authReady" class="fixed inset-0 z-50 bg-base-100">
      <div class="h-full w-full flex">
        <aside class="hidden lg:flex w-64 flex-col bg-base-200 border-r border-base-300">
          <div class="h-14 px-4 border-b border-base-300 flex items-center gap-3">
            <div class="skeleton h-7 w-7 rounded" />
            <div class="skeleton h-4 w-28" />
          </div>
          <div class="flex-1 p-4 space-y-3">
            <div class="skeleton h-10 w-full" />
            <div class="skeleton h-10 w-full" />
            <div class="skeleton h-10 w-full" />
            <div class="skeleton h-10 w-full" />
            <div class="skeleton h-10 w-full" />
          </div>
          <div class="border-t border-base-300 p-4">
            <div class="skeleton h-10 w-full" />
          </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0">
          <header class="h-14 border-b border-base-300 bg-base-200/80 backdrop-blur flex items-center px-4 gap-3">
            <span class="loading loading-spinner loading-sm" />
            <div class="skeleton h-4 w-32" />
            <div class="flex-1" />
            <div class="skeleton h-4 w-28 hidden sm:block" />
          </header>

          <main class="flex-1 p-4 overflow-hidden">
            <div class="mx-auto w-full max-w-9/10 space-y-4">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="card bg-base-200 shadow-md">
                  <div class="card-body space-y-3">
                    <div class="skeleton h-4 w-32" />
                    <div class="skeleton h-8 w-full" />
                    <div class="skeleton h-8 w-5/6" />
                    <div class="skeleton h-8 w-2/3" />
                  </div>
                </div>
                <div class="card bg-base-200 shadow-md lg:col-span-2">
                  <div class="card-body space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="skeleton h-4 w-40" />
                      <div class="skeleton h-8 w-24" />
                    </div>
                    <div class="skeleton h-10 w-full" />
                    <div class="skeleton h-10 w-full" />
                    <div class="skeleton h-10 w-full" />
                  </div>
                </div>
              </div>

              <div class="card bg-base-200 shadow-md">
                <div class="card-body space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="skeleton h-4 w-44" />
                    <div class="skeleton h-8 w-28" />
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="skeleton h-24 w-full" />
                    <div class="skeleton h-24 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

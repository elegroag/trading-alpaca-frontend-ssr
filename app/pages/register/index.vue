<script setup lang="ts">
// Página de registro (migrada de views/auth/RegisterView.vue)
import { UserPlusIcon } from '@heroicons/vue/24/outline'
import { useRegister } from './useRegister'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})

const {
  email,
  password,
  nombre,
  apellido,
  alpacaApiKey,
  alpacaSecretKey,
  alpacaBaseUrl,
  loading,
  error,
  handleSubmit,
} = useRegister()
</script>

<template>
  <section class="max-w-md w-full card bg-base-300 shadow-md">
    <div class="card-body space-y-4">
      <h1 class="card-title text-lg">Registro</h1>

      <form class="space-y-3" @submit.prevent="handleSubmit">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="input input-bordered w-full"
            autocomplete="email"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Password</span>
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="input input-bordered w-full"
            autocomplete="new-password"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Nombre</span>
            </label>
            <input v-model="nombre" type="text" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Apellido</span>
            </label>
            <input v-model="apellido" type="text" class="input input-bordered w-full" />
          </div>
        </div>

        <details class="collapse collapse-arrow bg-base-200" open>
          <summary class="collapse-title text-sm font-medium">
            Claves de Alpaca
          </summary>
          <div class="collapse-content space-y-2">
            <div class="form-control">
              <label class="label">
                <span class="label-text">API Key</span>
              </label>
              <input
                v-model="alpacaApiKey"
                type="text"
                required
                class="input input-bordered w-full"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Secret Key</span>
              </label>
              <input
                v-model="alpacaSecretKey"
                type="password"
                required
                class="input input-bordered w-full"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Base URL (opcional)</span>
              </label>
              <input
                v-model="alpacaBaseUrl"
                type="text"
                placeholder="https://paper-api.alpaca.markets"
                class="input input-bordered w-full"
              />
            </div>
          </div>
        </details>

        <div v-if="error" class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>

        <div class="form-control mt-4">
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm mr-2" />
            <UserPlusIcon v-else class="w-5 h-5 mr-2" />
            Registrarme
          </button>
        </div>
      </form>

      <p class="text-sm text-center">
        ¿Ya tienes cuenta?
        <NuxtLink to="/login" class="link">Inicia sesión</NuxtLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
// Página de login (migrada de views/auth/LoginView.vue)
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useLogin } from './useLogin'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})

const {
  email,
  password,
  loading,
  error,
  handleSubmit,
} = useLogin()
</script>

<template>
  <section class="max-w-md w-full card bg-base-300 shadow-md">
    <div class="card-body space-y-4">
      <h1 class="card-title text-lg">Iniciar sesión</h1>

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
            autocomplete="current-password"
          />
        </div>

        <div v-if="error" class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>

        <div class="form-control mt-4">
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm mr-2" />
            <ArrowLeftEndOnRectangleIcon v-else class="w-5 h-5 mr-2" />
            Entrar
          </button>
        </div>
      </form>

      <p class="text-sm text-center">
        ¿No tienes cuenta?
        <NuxtLink to="/register" class="link">Regístrate</NuxtLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
// Página de perfil (migrada de views/profile/ProfileView.vue)
import { CheckIcon, PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useProfile } from './useProfile'

definePageMeta({
  middleware: 'auth',
})

const {
  user,
  loadingProfile,
  profileError,
  alpacaApiKey,
  alpacaSecretKey,
  alpacaBaseUrl,
  paperTrading,
  saving,
  saveError,
  saveSuccess,
  favorites,
  loadingFavorites,
  favoritesError,
  updatingFavorites,
  newSymbol,
  selectedProfile,
  selectedModel,
  trendPrefsSaved,
  handleSubmit,
  addFavorite,
  removeFavorite,
  clearFavorites,
} = useProfile()
</script>

<template>
  <section class="max-w-lg mx-auto space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Perfil</h1>
    </header>

    <div v-if="loadingProfile" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>
    </div>

    <div v-else-if="profileError" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <div class="alert alert-error py-2 text-sm">{{ profileError }}</div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Datos de usuario -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body space-y-2 text-sm">
          <h2 class="card-title text-base">Datos de usuario</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span class="label-text">Email</span>
              <div class="font-semibold break-all">{{ user?.email }}</div>
            </div>
            <div>
              <span class="label-text">Rol</span>
              <div class="font-semibold">{{ user?.rol }}</div>
            </div>
            <div>
              <span class="label-text">Paper trading</span>
              <div class="font-semibold">{{ user?.paper_trading ? 'Activado' : 'Desactivado' }}</div>
            </div>
          </div>
          <p class="text-xs text-base-content/70 mt-2">
            Por seguridad, las claves Alpaca no se muestran. Puedes actualizarlas usando el formulario inferior.
          </p>
        </div>
      </div>

      <!-- Claves Alpaca -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body space-y-3">
          <h2 class="card-title text-base">Claves Alpaca</h2>

          <form class="space-y-3" @submit.prevent="handleSubmit">
            <div class="form-control">
              <label class="label">
                <span class="label-text">API Key (dejar vacío para no cambiar)</span>
              </label>
              <input v-model="alpacaApiKey" type="text" class="input input-bordered w-full" autocomplete="off" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Secret Key (dejar vacío para no cambiar)</span>
              </label>
              <input v-model="alpacaSecretKey" type="password" class="input input-bordered w-full" autocomplete="off" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Base URL</span>
              </label>
              <input v-model="alpacaBaseUrl" type="text" placeholder="https://paper-api.alpaca.markets" class="input input-bordered w-full" />
            </div>

            <div class="form-control">
              <label class="cursor-pointer flex items-center gap-2">
                <input v-model="paperTrading" type="checkbox" class="checkbox checkbox-sm" />
                <span class="label-text">Usar entorno paper trading</span>
              </label>
            </div>

            <div v-if="saveError" class="alert alert-error py-2 text-sm">{{ saveError }}</div>
            <div v-if="saveSuccess" class="alert alert-success py-2 text-sm">{{ saveSuccess }}</div>

            <div class="form-control mt-2">
              <button type="submit" class="btn btn-primary w-full" :disabled="saving">
                <span v-if="saving" class="loading loading-spinner loading-sm mr-2" />
                <CheckIcon v-else class="w-5 h-5 mr-2" />
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preferencias de tendencia -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body space-y-3">
          <h2 class="card-title text-base">Preferencias de análisis de tendencia</h2>
          <p class="text-xs text-base-content/70">
            Configura el perfil de horizonte temporal y el modelo de machine learning.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Perfil de horizonte</span>
              </label>
              <select v-model="selectedProfile" class="select select-bordered w-full">
                <option value="intradia">Intradía (1 día, ±0.3%)</option>
                <option value="corto">Corto plazo (3 días, ±1%)</option>
                <option value="largo">Largo plazo (10 días, ±3%)</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Modelo ML</span>
              </label>
              <select v-model="selectedModel" class="select select-bordered w-full">
                <option value="xgboost">XGBoost</option>
                <option value="random_forest">Random Forest</option>
              </select>
            </div>
          </div>

          <div v-if="trendPrefsSaved" class="alert alert-success py-2 text-xs">Preferencias guardadas</div>
        </div>
      </div>

      <!-- Símbolos favoritos -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body space-y-3">
          <h2 class="card-title text-base">Símbolos favoritos</h2>

          <div v-if="loadingFavorites" class="flex justify-center py-2">
            <span class="loading loading-spinner loading-sm" />
          </div>

          <div v-else class="space-y-3">
            <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="addFavorite">
              <input
                v-model="newSymbol"
                type="text"
                class="input input-bordered w-full sm:flex-1"
                placeholder="Ej: AAPL"
                autocomplete="off"
              />
              <button type="submit" class="btn btn-secondary w-full sm:w-auto" :disabled="updatingFavorites">
                <span v-if="updatingFavorites" class="loading loading-spinner loading-xs mr-1" />
                <PlusIcon v-else class="w-4 h-4 mr-1" />
                Agregar
              </button>
            </form>

            <div v-if="favoritesError" class="alert alert-error py-2 text-xs">{{ favoritesError }}</div>

            <div v-if="favorites.length === 0 && !favoritesError" class="text-xs text-base-content/70">
              No tienes símbolos favoritos aún.
            </div>

            <div v-else-if="favorites.length > 0" class="space-y-2">
              <ul class="flex flex-wrap gap-2">
                <li
                  v-for="symbol in favorites"
                  :key="symbol"
                  class="badge badge-outline gap-1 px-3 py-2 flex items-center"
                >
                  <span class="text-xs font-mono">{{ symbol }}</span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs px-1"
                    :disabled="updatingFavorites"
                    @click="removeFavorite(symbol)"
                    title="Quitar de favoritos"
                  >
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                </li>
              </ul>

              <div class="text-right">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-xs"
                  :disabled="updatingFavorites"
                  @click="clearFavorites"
                >
                  <TrashIcon class="w-4 h-4 mr-1" />
                  Limpiar todos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

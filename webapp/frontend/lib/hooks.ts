/**
 * React hooks for API interactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './api'
import type { Template } from './api'

// Templates
export function useTemplates(params?: {
  skip?: number
  limit?: number
  is_public?: boolean
  is_featured?: boolean
}) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => apiClient.listTemplates(params),
  })
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => apiClient.getTemplate(id),
    enabled: !!id,
  })
}

export function useGenerateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      options,
    }: {
      file: File
      options?: {
        title?: string
        description?: string
        palette_name?: string
        num_colors?: number
        is_public?: boolean
      }
    }) => apiClient.generateTemplate(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function usePalettes() {
  return useQuery({
    queryKey: ['palettes'],
    queryFn: () => apiClient.listPalettes(),
  })
}

export function usePresets() {
  return useQuery({
    queryKey: ['presets'],
    queryFn: () => apiClient.listPresets(),
  })
}

// Auth
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      email,
      password,
      full_name,
    }: {
      email: string
      password: string
      full_name?: string
    }) => apiClient.register(email, password, full_name),
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser(),
    retry: false,
  })
}

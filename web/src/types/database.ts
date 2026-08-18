// Escrito à mão a partir da introspecção do schema live (GET /rest/v1/ do
// projeto pnpoyhwdjconuillhfcz, compartilhado com estoque-santofavo e
// fichas-tecnicas) — não foi possível rodar `supabase gen types typescript`
// aqui (sem Docker, sem `supabase login`). `products`, `recipes`, `stores`
// e `user_roles` já existiam antes deste app; `etiquetas`, `responsaveis`
// e `usuarios_loja` foram criadas pelas migrations deste projeto.
// Reflete o modelo por conservação (migration modelo_conservacao):
// dias_ambiente/dias_refrigerado/dias_congelado em products/recipes,
// e `conservacao` gravada em etiquetas. Regerar com o comando real
// quando possível.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      etiquetas: {
        Row: {
          baixada_em: string | null
          baixada_por: string | null
          conservacao: string
          copias: number | null
          data_base: string
          data_validade: string
          id: string
          impressa_em: string | null
          loja_id: string | null
          nome_livre: string | null
          produto_id: string | null
          recipe_id: string | null
          responsavel_id: string | null
          snapshot: Json
          status: string | null
        }
        Insert: {
          baixada_em?: string | null
          baixada_por?: string | null
          conservacao: string
          copias?: number | null
          data_base: string
          data_validade: string
          id?: string
          impressa_em?: string | null
          loja_id?: string | null
          nome_livre?: string | null
          produto_id?: string | null
          recipe_id?: string | null
          responsavel_id?: string | null
          snapshot: Json
          status?: string | null
        }
        Update: {
          baixada_em?: string | null
          baixada_por?: string | null
          conservacao?: string
          copias?: number | null
          data_base?: string
          data_validade?: string
          id?: string
          impressa_em?: string | null
          loja_id?: string | null
          nome_livre?: string | null
          produto_id?: string | null
          recipe_id?: string | null
          responsavel_id?: string | null
          snapshot?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etiquetas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiquetas_baixada_por_fkey"
            columns: ["baixada_por"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_impressao: {
        Row: {
          criada_em: string
          erro: string | null
          etiqueta_id: string | null
          id: string
          impressa_em: string | null
          loja_id: string
          status: string
          zpl: string
        }
        Insert: {
          criada_em?: string
          erro?: string | null
          etiqueta_id?: string | null
          id?: string
          impressa_em?: string | null
          loja_id: string
          status?: string
          zpl: string
        }
        Update: {
          criada_em?: string
          erro?: string | null
          etiqueta_id?: string | null
          id?: string
          impressa_em?: string | null
          loja_id?: string
          status?: string
          zpl?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_impressao_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_cost: number | null
          barcode: string | null
          category: string
          category_id: string | null
          code: number | null
          current_stock: number | null
          dias_ambiente: number | null
          dias_apos_abertura: number | null
          dias_congelado: number | null
          dias_refrigerado: number | null
          id: string
          last_cost: number | null
          min_stock: number | null
          name: string
          subcategory_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          category: string
          category_id?: string | null
          code?: number | null
          current_stock?: number | null
          dias_ambiente?: number | null
          dias_apos_abertura?: number | null
          dias_congelado?: number | null
          dias_refrigerado?: number | null
          id?: string
          last_cost?: number | null
          min_stock?: number | null
          name: string
          subcategory_id?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          category?: string
          category_id?: string | null
          code?: number | null
          current_stock?: number | null
          dias_ambiente?: number | null
          dias_apos_abertura?: number | null
          dias_congelado?: number | null
          dias_refrigerado?: number | null
          id?: string
          last_cost?: number | null
          min_stock?: number | null
          name?: string
          subcategory_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          assembly_instructions: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          dias_ambiente: number | null
          dias_apos_abertura: number | null
          dias_congelado: number | null
          dias_refrigerado: number | null
          general_notes: string | null
          id: string
          is_favorite: boolean
          is_sub_recipe: boolean
          tags: string[] | null
          title: string
          updated_at: string
          yield_amount: number | null
          yield_description: string | null
          yield_grams: number | null
          yield_unit: string | null
        }
        Insert: {
          assembly_instructions?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          dias_ambiente?: number | null
          dias_apos_abertura?: number | null
          dias_congelado?: number | null
          dias_refrigerado?: number | null
          general_notes?: string | null
          id?: string
          is_favorite?: boolean
          is_sub_recipe?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
          yield_amount?: number | null
          yield_description?: string | null
          yield_grams?: number | null
          yield_unit?: string | null
        }
        Update: {
          assembly_instructions?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          dias_ambiente?: number | null
          dias_apos_abertura?: number | null
          dias_congelado?: number | null
          dias_refrigerado?: number | null
          general_notes?: string | null
          id?: string
          is_favorite?: boolean
          is_sub_recipe?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
          yield_amount?: number | null
          yield_description?: string | null
          yield_grams?: number | null
          yield_unit?: string | null
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          ativo: boolean | null
          id: string
          loja_id: string | null
          nome: string
          pin: string | null
        }
        Insert: {
          ativo?: boolean | null
          id?: string
          loja_id?: string | null
          nome: string
          pin?: string | null
        }
        Update: {
          ativo?: boolean | null
          id?: string
          loja_id?: string | null
          nome?: string
          pin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      usuarios_loja: {
        Row: {
          loja_id: string
          user_id: string
        }
        Insert: {
          loja_id: string
          user_id: string
        }
        Update: {
          loja_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_loja_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_loja_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

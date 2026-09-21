class Vaga < ApplicationRecord
  CARGO_CATEGORIAS = [
    "Java Backend Developer Júnior",
    "Java Developer Júnior",
    "Backend Developer Júnior",
    "Software Engineer Júnior"
  ].freeze

  PLATAFORMAS = %w[Gupy InHire Solides].freeze

  STATUSES = %w[detectado enviada nao_aplicavel candidatado].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :buscar, ->(termo) {
    where("empresa ILIKE :t OR titulo_vaga ILIKE :t", t: "%#{termo}%")
  }

  scope :filtrar_por_local, ->(termo) {
    where("local ILIKE :t", t: "%#{termo}%")
  }

  def self.stats_gerais
    {
      total: count,
      na_lista: where(na_lista: "Sim").count,
      empresas: distinct.count(:empresa),
      enviadas: where(status: "enviada").count,
      candidatadas: where(status: "candidatado").count
    }
  end
end

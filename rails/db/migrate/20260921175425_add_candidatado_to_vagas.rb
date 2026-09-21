class AddCandidatadoToVagas < ActiveRecord::Migration[8.1]
  def change
    add_column :vagas, :candidatado_em, :datetime
    add_column :vagas, :observacoes, :text
  end
end

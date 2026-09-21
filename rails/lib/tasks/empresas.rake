namespace :empresas do
  desc "Importa a lista de empresas do empresas.xlsx (via companies.json) para EmpresaAlvo"
  task importar: :environment do
    source_dir = Pathname.new(
      ENV.fetch("VAGAS_SOURCE_DIR") { Rails.root.join("..", "busca-vagas-gupy-inhire", "busca_vagas") }
    )

    path = source_dir.join("companies.json")
    raise "Arquivo não encontrado: #{path}" unless File.exist?(path)

    nomes = JSON.parse(File.read(path))
      .map { |n| n.to_s.strip.squeeze(" ") }
      .reject(&:blank?)

    # normaliza para evitar duplicatas por case/espaços no próprio arquivo
    nomes_unicos = nomes.map { |n| [n.downcase, n] }.to_h.values

    criadas = 0
    ignoradas = 0

    nomes_unicos.each do |nome|
      # comparação case-insensitive para não conflitar com empresas já cadastradas
      empresa = EmpresaAlvo.where("LOWER(empresa) = LOWER(?)", nome).first_or_initialize(empresa: nome)
      if empresa.new_record?
        empresa.save!
        criadas += 1
      else
        ignoradas += 1
      end
    end

    puts "Importação concluída: #{criadas} empresas criadas, #{ignoradas} já existiam. Total: #{nomes.length}."
  end
end

import path from 'node:path'
import { expect, test } from '@playwright/test'

// Fluxo de ponta a ponta descrito em TESTES.md: cadastro -> login -> novo
// orçamento (com upload de receita) -> pedido aparece em "Meus pedidos".
// Cada novo e-mail é único (timestamp) para o teste poder rodar várias vezes
// seguidas sem colidir com "e-mail já cadastrado".
test('cliente consegue se cadastrar, logar e enviar uma receita', async ({ page }) => {
  const email = `cliente.e2e.${Date.now()}@teste.com`
  const senha = 'SenhaForte123'
  const receitaFake = path.join(__dirname, 'fixtures', 'receita-fake.png')

  // 1. Abrir o site
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)

  // 2. Cadastro
  await page.getByRole('link', { name: 'Criar minha conta' }).click()
  await expect(page).toHaveURL(/\/cadastro/)

  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Crie uma senha').fill(senha)
  await page.getByLabel('Repita a senha').fill(senha)
  await page.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page).toHaveURL(/\/login\?cadastrado=true/)
  await expect(page.getByText('Conta criada! Agora é só entrar.')).toBeVisible()

  // 3. Login
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/')

  // 4. Novo orçamento — passo 1 (para quem é): "Para mim" já vem selecionado
  await page.getByRole('link', { name: 'Enviar receita' }).first().click()
  await expect(page).toHaveURL(/\/novo-orcamento/)
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Passo 2: upload da receita (imagem fake)
  // Há dois inputs com accept="image/*,.pdf" nesta tela (a receita principal e
  // os "anexos extras"); filtra pelo texto do label pra pegar só o da receita.
  await page
    .locator('label', { hasText: 'Escolher foto ou PDF salvo' })
    .locator('input[type="file"]')
    .setInputFiles(receitaFake)
  await expect(page.getByText('receita-fake.png')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Passo 3: observações/produtos — opcional, pula
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Passo 4: revisão e envio
  await page.getByRole('heading', { name: 'Confira antes de enviar' }).waitFor()
  await page.getByRole('button', { name: 'Enviar para a farmácia' }).click()

  // Confirmação com o número do protocolo
  await expect(page.getByRole('heading', { name: 'Receita enviada!' })).toBeVisible()
  const linkAcompanhar = page.getByRole('link', { name: 'Acompanhar meu pedido' })
  const href = await linkAcompanhar.getAttribute('href')
  const pedidoId = href?.split('#pedido-')[1]
  expect(pedidoId).toBeTruthy()

  // 5. Verificar que o pedido aparece em "Meus pedidos"
  await linkAcompanhar.click()
  await expect(page).toHaveURL(/\/meus-pedidos/)
  await expect(page.locator(`#pedido-${pedidoId}`)).toBeVisible()
})

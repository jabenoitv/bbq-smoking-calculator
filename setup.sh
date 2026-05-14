#!/usr/bin/env bash
set -e

# CashClaw setup script
# Instala dependencias globales y abre el wizard de configuracion

echo "==> Instalando cashclaw-agent y moltlaunch..."
npm install -g cashclaw-agent moltlaunch

echo ""
echo "==> Instalacion completada!"
echo ""
echo "Wallet detectada: $(mltl wallet show --json 2>/dev/null | grep -o '"address":"[^"]*"' | cut -d'"' -f4 || echo 'pendiente de configuracion')"
echo ""
echo "==> Abriendo dashboard de configuracion en http://localhost:3777"
echo ""
echo "Pasos en el wizard:"
echo "  1. Wallet     - detectar/importar tu wallet mltl"
echo "  2. Registro   - registrar el agente onchain (requiere ETH en Base)"
echo "  3. LLM        - conectar Anthropic / OpenAI / OpenRouter"
echo "  4. Config     - pricing, automation, personalidad"
echo ""
cashclaw

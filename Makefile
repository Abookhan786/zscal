.PHONY: help install dev start test lint clean docker-dev docker-prod

help:
	@echo "ZeroTrustX Build & Management Tasks:"
	@echo "  make install     - Install all backend and frontend dependencies"
	@echo "  make dev         - Run backend and frontend concurrently"
	@echo "  make test        - Run backend test suite"
	@echo "  make docker-dev  - Spin up local Docker development environment"
	@echo "  make docker-prod - Spin up production compose stack"

install:
	pip install -r requirements.txt
	cd apps/web-console && npm install

dev-backend:
	python main.py

dev-frontend:
	cd apps/web-console && npm run dev

test:
	pytest tests/ -v

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf dist build .coverage

docker-dev:
	docker compose -f infrastructure/docker/docker-compose.dev.yml up --build

docker-prod:
	docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

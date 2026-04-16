setup:
	cp -n .env.example .env || true
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

test:
	docker compose run --rm backend sh -c "python manage.py migrate && pytest --cov=api --cov-report=term-missing"

lint:
	docker compose run --rm backend flake8 .
	docker compose run --rm frontend npm run lint

validate-env:
	sh scripts/validate-env.sh

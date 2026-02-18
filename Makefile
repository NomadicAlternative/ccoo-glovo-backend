# Makefile with common tasks for development

.PHONY: install dev start db-push migrate seed generate build

install:
	npm install

dev:
	npm run dev

start:
	npm run start

db-push:
	npm run db:push

migrate:
	npm run migrate:dev

seed:
	npm run seed:admin

generate:
	npm run prisma:generate

build:
	docker build -t ccoo-glovo-backend:latest .

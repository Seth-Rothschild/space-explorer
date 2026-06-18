install:
	./scripts/install.sh

format:
	./scripts/format.sh

test: format
	./scripts/test.sh

run:
	./scripts/run.sh

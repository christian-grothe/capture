DEPS := $(shell find ./ -type f -name '*.cpp')

build: $(DEPS)
	@emcc \
		--bind \
		--post-js ./em-es6-module.js \
		-s ENVIRONMENT=shell \
		-s SINGLE_FILE=1 \
		-s WASM=1 \
		-s WASM_ASYNC_COMPILATION=0 \
		-s EXPORTED_FUNCTIONS="['_malloc']" \
		-o ../capture_frontend/src/worklets/capture.wasm.js \
		./capture_bind.cpp $(DEPS)

	@echo "Build complete"
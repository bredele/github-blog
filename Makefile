
run: update
	@NODE_PATH=server NODE_ENV=development ./bin/run.js

build: update
	@NODE_PATH=server ./bin/build.js	

update: component.json
	@component install --dev

clean:
	rm -fr build components 

.PHONY: clean
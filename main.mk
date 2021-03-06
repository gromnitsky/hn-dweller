.DELETE_ON_ERROR:

pp-%:
	@echo "$(strip $($*))" | tr ' ' \\n

export NODE_ENV ?= development
out := $(NODE_ENV)
src := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
proj.name := hn-dweller
proj.version := $(shell json < $(src)/manifest.json version)

mkdir = @mkdir -p $(dir $@)


.PHONY: compile
compile:


package.json: $(src)/package.json
	cp $< $@

export NODE_PATH = $(realpath node_modules)
node_modules: package.json
	npm i --loglevel=error --depth=0
	touch $@


js.src := $(shell find $(src) -name '*.js' -type f | grep -v test)
js.dest := $(patsubst $(src)%.js, $(out)/.ccache/%.js, $(js.src))

ifeq ($(NODE_ENV), development)
BABEL_OPT := -s inline
endif
$(out)/.ccache/%.js: $(src)%.js
	$(mkdir)
	node_modules/.bin/babel --presets es2015 --plugins transform-inline-environment-variables $(BABEL_OPT) $< -o $@

$(js.dest): node_modules
compile: $(js.dest)


bundles.src := $(filter %/main.js, $(js.dest)) $(out)/.ccache/event_page.js
bundles.dest := $(patsubst $(out)/.ccache/%.js, $(out)/%.js, $(bundles.src))

-include $(bundles.src:.js=.d)

define make-depend
@echo Generating $(basename $<).d
@printf '%s: ' $@ > $(basename $<).d
@node_modules/.bin/browserify --no-bundle-external --list $< \
	| sed s,$(CURDIR)/,, | sed s,$<,, | tr '\n' ' ' \
	>> $(basename $<).d
endef

ifeq ($(NODE_ENV), development)
BROWSERIFY_OPT := -d
endif
$(bundles.dest): $(out)/%.js: $(out)/.ccache/%.js
	$(mkdir)
	node_modules/.bin/browserify $(BROWSERIFY_OPT) $< -o $@
	$(make-depend)

compile: $(bundles.dest)


static.src := $(wildcard $(src)/*/*.css $(src)/*/*.html) $(wildcard $(src)/icons/*.png) $(src)/manifest.json
static.dest := $(patsubst $(src)%, $(out)/%, $(static.src))

$(static.dest): $(out)/%: $(src)%
	$(mkdir)
	cp $< $@

compile: $(static.dest)


define get-test-data =
$(mkdir)
cd `dirname $(dir $@)` && wget -Epkq '$(1)'
@if [ -r $@ ]; then :; else (cd $(dir $@) && mv *.html index.html); fi
endef

test/data/frontpage/news.ycombinator.com/index.html:
	$(call get-test-data,https://news.ycombinator.com)

test/data/user-comments/news.ycombinator.com/index.html:
	$(call get-test-data,https://news.ycombinator.com/threads?id=edw519)


.PHONY: test
test: test/data/frontpage/news.ycombinator.com/index.html \
		test/data/user-comments/news.ycombinator.com/index.html
	node_modules/.bin/mocha -u tdd $(src)/test/test_*.js $(TEST_OPT)


pkg.name := $(proj.name)-$(proj.version)-$(NODE_ENV)
$(pkg.name).zip: compile
	rm -f $@
	cd $(out) && zip -qr $(CURDIR)/$@ *

%.crx: %.zip private.pem
	rm -f $@
	$(src)/zip2crx.sh $< private.pem

.PHONY: crx
crx: $(pkg.name).crx

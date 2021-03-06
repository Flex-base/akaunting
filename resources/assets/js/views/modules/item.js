/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('../../bootstrap');

import Vue from 'vue';

import DashboardPlugin from './../../plugins/dashboard-plugin';

import Global from '../../mixins/global';

import {Progress} from 'element-ui';

import AkauntingCarousel from './../../components/AkauntingCarousel';

// plugin setup
Vue.use(DashboardPlugin, Progress);

const app = new Vue({
    el: '#app',

    mixins: [
        Global
    ],

    components: {
        [Progress.name]: Progress,
        AkauntingCarousel
    },

    mounted() {
        this.onReleases(1);
        this.onReviews(1);
    },

    data: function () {
        return {
            releases: {
                status: false,
                html: '',
                pagination: {
                    current_page: 1,
                    last_page: 1
                }
            },
            reviews: {
                status: false,
                html: '',
                pagination: {
                    current_page: 1,
                    last_page: 1
                }
            },
            faq: false,
            installation: {
                show: false,
                steps: [],
                steps_total: 0,
                total: 0,
                path: '',
                alias: '',
                version: '',
                status: 'success',
                html: ''
            },
        }
    },

    methods: {
        addToCart(alias, subscription_type) {
            let add_to_cart_promise = Promise.resolve(axios.get(url + '/apps/' + alias + '/' + subscription_type +'/add'));

            add_to_cart_promise.then(response => {
                if (response.data.success) {
                    this.$notify({
                        message: response.data.message,
                        timeout: 0,
                        icon: "fas fa-bell",
                        type: 'success'
                    });
                }

                if (response.data.error) {
                    this.installation.status = 'exception';
                    this.installation.html = '<div class="text-danger">' + response.data.message + '</div>';
                }

                // Set steps
                if (response.data.data) {
                    this.installation.steps = response.data.data;
                    this.installation.steps_total = this.installation.steps.length;

                    this.next();
                }
            })
            .catch(error => {
            });
        },

        onChangeCategory(category) {
            if (!category.length) {
                return;
            }

            let path =  document.getElementById('category_page').value;

            if (category != '*') {
                path += '/' + encodeURIComponent(category);
            } else {
                path = app_home;
            }

            location = path;
        },

        async onReleases(page) {
            let releases_promise = Promise.resolve(window.axios.post(url + '/apps/' + app_slug  + '/releases', {
                page: page
            }));

            releases_promise.then(response => {
                if (response.data.success) {
                    this.releases.status= true;
                    this.releases.html = response.data.html;

                    this.releases.pagination.current_page = page;
                    this.releases.pagination.last_page = response.data.data.last_page;
                }
            })
            .catch(error => {
            });
        },

        async onReviews(page) {
            let reviews_promise = Promise.resolve(window.axios.post(url + '/apps/' + app_slug  + '/reviews', {
                page: page
            }));

            reviews_promise.then(response => {
                if (response.data.success) {
                    this.reviews.status= true;
                    this.reviews.html = response.data.html;

                    this.reviews.pagination.current_page = page;
                    this.reviews.pagination.last_page = response.data.data.last_page;
                }
            })
            .catch(error => {
            });
        },

        onShowFaq() {
            this.faq = true;
        },

        async onInstall(path, alias, name, version) {
            this.installation.alias = alias;
            this.installation.show = true;
            this.installation.total = 0;
            this.installation.path = path;
            this.installation.version = version;

            let steps_promise = Promise.resolve(axios.post(url + '/apps/steps', {
                name: name,
                alias: alias,
                version: version
            }));

            steps_promise.then(response => {
                if (response.data.error) {
                    this.installation.status = 'exception';
                    this.installation.html = '<div class="text-danger">' + response.data.message + '</div>';
                }

                // Set steps
                if (response.data.data) {
                    this.installation.steps = response.data.data;
                    this.installation.steps_total = this.installation.steps.length;

                    this.next();
                }
            })
            .catch(error => {
            });
        },

        async next() {
            let data = this.installation.steps.shift();

            if (data) {
                this.installation.total = parseInt((100 - ((this.installation.steps.length / this.installation.steps_total) * 100)).toFixed(0));

                this.installation.html = '<span class="text-default"><i class="fa fa-spinner fa-spin update-spin"></i> ' + data['text'] + '</span> </br>';

                let step_promise = Promise.resolve(axios.post(data.url, {
                    alias: this.installation.alias,
                    version: this.installation.version,
                    path: this.installation.path,
                }));

                step_promise.then(response => {
                    if (response.data.error) {
                        this.installation.status = 'exception';
                        this.installation.html = '<div class="text-danger"><i class="fa fa-times update-error"></i> ' + response.data.message + '</div>';
                    }

                    if (response.data.success) {
                        this.installation.status = 'success';
                    }

                    if (response.data.data.path) {
                        this.installation.path = response.data.data.path;
                    }

                    if (!response.data.error && !response.data.redirect) {
                        setTimeout(function() {
                            this.next();
                        }.bind(this), 800);
                    }

                    if (response.data.redirect) {
                        window.location = response.data.redirect;
                    }
                })
                .catch(error => {
                });
            }
        }
    }
});

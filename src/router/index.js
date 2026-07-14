import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostListView from '../views/PostListView.vue'
import PostFormView from '../views/PostFormView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PlacesListView from '../views/PlacesListView.vue'
import PlaceDetailView from '../views/PlaceDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/places', name: 'places-list', component: PlacesListView },
  { path: '/places/:id', name: 'place-detail', component: PlaceDetailView, props: true },
  { path: '/posts', name: 'post-list', component: PostListView },
  { path: '/posts/new', name: 'post-create', component: PostFormView },
  { path: '/posts/:id', name: 'post-detail', component: PostDetailView, props: true },
  { path: '/posts/:id/edit', name: 'post-edit', component: PostFormView, props: true },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
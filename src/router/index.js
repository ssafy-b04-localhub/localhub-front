import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Places from "../views/Places.vue";
import PlaceDetail from "../views/PlaceDetail.vue";
import PostsList from "../views/PostsList.vue";
import PostDetail from "../views/PostDetail.vue";
import PostForm from "../views/PostForm.vue";
import NotFound from "../views/NotFound.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/places", name: "Places", component: Places },
  {
    path: "/places/:id",
    name: "PlaceDetail",
    component: PlaceDetail,
    props: true,
  },
  { path: "/posts", name: "PostsList", component: PostsList },
  { path: "/posts/new", name: "PostNew", component: PostForm },
  {
    path: "/posts/:id",
    name: "PostDetail",
    component: PostDetail,
    props: true,
  },
  {
    path: "/posts/:id/edit",
    name: "PostEdit",
    component: PostForm,
    props: true,
  },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

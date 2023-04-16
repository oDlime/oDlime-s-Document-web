<template>
  <div id="app">
    <el-container class="blur container">
      <el-aside class="blur" width="300px" v-if="listdata.data">
        <el-row class="asidehead">
          <el-button icon="el-icon-folder-add" size="mini" round @click="newdir"
            >新建</el-button
          >
          <el-button
            icon="el-icon-document-add"
            size="mini"
            round
            @click="newmd"
          ></el-button>
          <el-button
            icon="el-icon-edit"
            size="mini"
            circle
            @click="tedit"
            v-show="this.filepath"
          ></el-button>
          <el-button
            icon="el-icon-key"
            size="mini"
            round
            @click="newakey"
            v-show="!key"
            >密钥</el-button
          >
        </el-row>
        <div class="asidelist">
          <div class="list">
            <div class="back" v-show="this.pathList.length" @click="backclick">
              <i class="el-icon-arrow-left"></i>
              上一级目录
            </div>
            <div
              class="list-item"
              v-for="(value, index) in listdata.data"
              :key="index"
              @click="listclick(value)"
              @contextmenu.prevent.stop="menuclick(index, value)"
              :class="{ active: index === activeindex }"
            >
              <span class="setting" style="margin-right: 8px">
                <el-link
                  icon="el-icon-edit"
                  @click.prevent.stop="listrename(index, value)"
                  >重命名</el-link
                >/<el-link
                  icon="el-icon-delete"
                  @click.prevent.stop="listdel(index, value)"
                  >删除</el-link
                >
              </span>
              <i class="el-icon-folder" v-show="!value.includes('.md')"></i>
              <i class="el-icon-document" v-show="value.includes('.md')"></i>
              {{ value }}
            </div>
            <br /><br /><br /><br />
          </div>
        </div>
      </el-aside>
      <el-main>
        <div class="contentmain">
          <el-breadcrumb separator="/" class="navlink">
            <el-breadcrumb-item :to="{ path: '/' }"
              ><span @click="linktoroot"
                ><i class="el-icon-notebook-1"></i>根目录</span
              ></el-breadcrumb-item
            >
            <el-breadcrumb-item
              v-for="(item, index) in pathList"
              :key="index"
              :to="{ path: '/' }"
            >
              <span @click="linkto(index)">{{ item }}</span></el-breadcrumb-item
            >
          </el-breadcrumb>

          <v-md-editor
            v-model="mds"
            v-show="editing"
            class="mdeditor"
            @save="savemd"
          ></v-md-editor>
          <div
            v-show="!islodding && !editing"
            class="content"
            v-html="this.content"
          ></div>
          <div v-show="islodding">
            <el-skeleton :rows="3" animated /> <br /><br />
            <el-skeleton :rows="4" animated /><br /><br />
            <el-skeleton :rows="6" animated />
          </div>
          <!-- 起始页 -->
          <div v-show="isfirst && !islodding" class="home">
            <div class="box">
              <el-link type="info" icon="el-icon-key" @click="newakey()">{{
                key === "" ? "输入密钥" : "修改密钥"
              }}</el-link
              ><br />
              <el-link type="info" icon="el-icon-set-up" @click="setserve()">
                服务器地址
              </el-link>
            </div>
          </div>
        </div>
        <br /><br /><br /><br />
      </el-main>
    </el-container>
  </div>
</template>

<script src="./assets/js/md5"></script>
<script>
import axios from "axios";
import { marked } from "marked";
import md5 from "md5";
export default {
  name: "App",
  data() {
    return {
      serveripandport: "http://127.0.0.1:8080",
      key: "",
      isfirst: true,
      listdata: { data: [] },
      pathList: [], // 记录已经点击的列表项，用于拼接成目录url
      content: "",
      filename: "",
      filepath: "",
      islodding: false,
      activeindex: -1,
      activetimer: null,
      mds: "",
      editing: false,
    };
  },
  components: {},
  methods: {
    setserve() {
      this.$prompt("http://ip:port", "修改服务器", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: this.serveripandport,
      })
        .then(({ value }) => {
          const d = new Date();
          d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000); // 一周的时间
          const expires = `expires=${d.toUTCString()}`;
          document.cookie = `server=${value}; ${expires}; path=/`;
          this.serveripandport = value;
        })
        .catch(() => {});
    },
    newakey() {
      this.$prompt("", "输入密钥", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(({ value }) => {
          let va = md5(value);
          const d = new Date();
          d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000); // 一周的时间
          const expires = `expires=${d.toUTCString()}`;
          document.cookie = `dockey=${va}; ${expires}; path=/`;
          this.key = va;
        })
        .catch(() => {});
    },
    savemd() {
      var path = this.getthisurl();
      this.httpdata({
        url: "md/editmd",
        path,
        content: this.mds,
        name: this.filename,
      });
    },
    tedit() {
      this.editing = !this.editing;
      this.httpdata({ url: "md", path: this.filepath + "/" + this.filename });
    },
    listdel(index, value) {
      this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        var path = this.getthisurl();
        this.httpdata({ url: "md/deldir", path, name: value });
      });
    },
    listrename(index, oldname) {
      this.$prompt("请输入文件名称", "重命名", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /[\w\s\u4e00-\u9fa5]+/,
        inputErrorMessage: "名称格式错误",
      })
        .then(({ value }) => {
          var path = this.getthisurl();
          this.httpdata({ url: "md/rename", path, name: value, oldname });
        })
        .catch(() => {});
    },
    menuclick(index) {
      if (this.activetimer) {
        clearTimeout(this.activetimer);
      }
      this.activeindex = index;
      this.activetimer = setTimeout(() => {
        this.activeindex = -1;
        this.activetimer = null;
      }, 2000);
    },
    newmd() {
      this.$prompt("请输入文件名称", "新建笔记", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[a-zA-Z0-9_-]+$/,
        inputErrorMessage: "文件名称格式错误",
      })
        .then(({ value }) => {
          var path = this.getthisurl();
          this.httpdata({ url: "md/newmd", path, name: value });
        })
        .catch(() => {});
    },
    newdir() {
      this.$prompt("请输入文件夹名称", "新建文件夹", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[a-zA-Z0-9_-]+$/,
        inputErrorMessage: "文件夹名称格式错误",
      })
        .then(({ value }) => {
          var path = this.getthisurl();
          this.httpdata({ url: "md/newdir", path, name: value });
        })
        .catch(() => {});
    },
    linktoroot() {
      this.pathList = [];
      this.getdata({ url: "md", path: "" });
    },
    linkto(index) {
      this.pathList = this.pathList.slice(0, index + 1);
      const path = this.pathList.join("/");
      this.getdata({ url: "md", path });
    },
    listclick(value) {
      this.activeindex = -1;
      const path = this.pathList.concat([value]).join("/");
      this.getdata({ url: "md", path });
      if (!path.includes(".md")) {
        this.pathList.push(value);
      } else {
        this.islodding = true;
        this.content = "";
        this.filename = value;
        this.filepath = this.getthisurl();
      }
    },
    compare(a, b) {
      if (a.includes(".md") && !b.includes(".md")) {
        return 1;
      }
      if (!a.includes(".md") && b.includes(".md")) {
        return -1;
      }
      return 0;
    },
    backclick() {
      this.activeindex = -1;
      this.pathList.pop();
      const path = this.pathList.join("/");
      this.getdata({ url: "md", path });
    },
    getthisurl() {
      return this.pathList.join("/");
    },
    httpdata({ url, path, name, oldname, content }) {
      axios.defaults.crossDomain = true;
      axios.defaults.headers.common["Access-Control-Allow-Origin"] =
        process.env.VUE_APP_Access_Control_Allow_Origin;
      axios
        .post(
          this.serveripandport + "/" + url,
          { path, name, oldname, content, key: this.key },
          { timeout: 1000 * 20 }
        )
        .then((response) => {
          if (response.data.code !== 200) {
            this.$message.error(response.data.msg);
            if (response.data.msg === "身份验证失败") {
              this.key = "";
              this.newakey();
            }
          }
          if (path.includes(".md")) {
            this.content = marked(response.data.data);
            this.mds = response.data.data;
            this.isfirst = false;
          } else {
            if (response.data.data === null) return;
            this.listdata = response.data;
            this.listdata.data = this.listdata.data.sort(this.compare);
          }
          this.islodding = false;
        })
        .catch((error) => {
          this.$message.error(error);
        });
    },
    getdata(path) {
      this.httpdata(path);
    },
  },
  mounted() {
    let value = "";
    const cookieString = document.cookie;
    const cookieArray = cookieString.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
      const cookie = cookieArray[i].trim();
      if (cookie.startsWith("dockey=")) {
        value = cookie.substring("dockey=".length, cookie.length);
        this.key = value;
      }
      if (cookie.startsWith("server=")) {
        value = cookie.substring("server=".length, cookie.length);
        this.serveripandport = value;
      }
    }
    console.log(this.serveripandport);
    this.getdata({ url: "md", path: "" });
  },
};
</script>
<style>
body {
  overflow: hidden;
  user-select: none;
}
::-webkit-scrollbar {
  width: 5px;
  height: 10px;
  background-color: #f5f5f5;
}
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(219, 219, 219, 0.664);
  border-radius: 10px;
  background-color: #f5f5f5;
}
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(202, 202, 202, 0.753);
  background-color: #cccccc;
}
::selection {
  background: #60afff43;
}
.container {
  height: 100%;
}
.asidelist {
  padding: 20px 20px 100px 20px;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  transition: 0.2s;
}
.asidelist .list {
  position: relative;
  cursor: pointer;
  width: 400px;
  font-family: Courier, monospace;
}
.asidelist .list .list-item {
  text-overflow: ellipsis;
  overflow: hidden;
  word-break: break-all;
  white-space: nowrap;
  position: relative;
  left: -130px;
  color: #a1a1a1;
  text-shadow: 0px 0px 0px #696969;
}
.asidelist .list .list-item:hover {
  transition: 0.1s;
  color: #000;
  text-shadow: 0px 0px 2px #000;
}
.asidelist .list .back {
  transition: 0.3s;
  text-shadow: 0px 0px 0px #000;
}
.asidelist .list .back:hover {
  letter-spacing: 3px;
  transform: translateX(10px);
  text-shadow: 0px 0px 3px #000;
}
.asidelist .active {
  padding-left: 130px;
}
.asidelist .setting {
  position: relative;
  left: -130px;
  transition: 0.4s;
  color: rgba(12, 166, 255, 0.411);
}
.asidelist .active .setting {
  left: 0px;
  color: rgb(48, 48, 48, 1);
}
.asidehead {
  padding: 10px 0px 0px 20px;
}
.blur {
  background-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(18.5px);
  -webkit-backdrop-filter: blur(18.5px);
}
pre {
  background: #f8f8f8;
  padding: 20px;
  border-radius: 7px;
  border: 1px solid #e7eaed;
}

pre code {
  background: #f8f8f8;
  border: 0px solid transparent;
  user-select: all;
}
.content {
  padding: 20px 90px 80px 90px;
  margin: 40px 0px;
}

.contentmain {
  height: 100vh;
  overflow-y: scroll;
  padding: 40px;
}
.mdeditor {
  height: 88%;
}
.home {
  /* background: #a1a1a1; */
  width: 300px;
  height: 350px;
  margin: 5% 10%;
}
</style>

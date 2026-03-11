export const guangzhoujibaoduan = () => {
  return {
    storageKey: "guangzhoujibaoduan",
    initializer: () => {
      return {
        get_ip: "",
        get_port: 0,
        post_ip: "",
        post_port: 0,
        unitCode: "",
        signature_prefix: "",
        autoUpload: false,
        autoUploadInterval: 0,
      };
    },
  };
};

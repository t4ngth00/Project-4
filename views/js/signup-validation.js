$(function() {
  $("form[name='signup']").validate({
    rules: {
      email: {
        required: true,
        minlength: 4
      },
      password: {
        required: true,
        minlength: 5
      },
      cpassword: {
        required: true,
        minlength: 5,
        equalTo: "#password"
      }
    },

    messages: {
      email: {
        required: "Please provide a username",
        minlength: "Username have at least 4 characters"
      },
      password: {
        required: "Please provide a password",
        minlength: "Password have at least 5 characters"
      },
      cpassword:{
        required: "Please confirm the password",
        minlength: "Password have at least 5 characters",
        equalTo: "Password doesn't match"
      }
    },
    submitHandler: function(form) {
      form.submit();
    }
  });

});

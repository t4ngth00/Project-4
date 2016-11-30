$(function() {
  $("form[name='login']").validate({
    rules: {
      email: {
        required: true,
        minlength: 4
      },
      password: {
        required: true,
        minlength: 5
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
      }
    },
    submitHandler: function(form) {
      form.submit();
    }
  });

});

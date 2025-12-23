document.getElementById("enviar").addEventListener("click", function () {
  const tipo = document.getElementById("tipo").value;
  const descripcion = document.getElementById("descripcion").value;

  if (!tipo || !descripcion) {
    alert("Por favor complete todos los campos antes de enviar el reporte.");
    return;
  }

  alert(
    `Reporte enviado correctamente.\nTipo: ${tipo}\nDescripción: ${descripcion}`
  );
  document.getElementById("tipo").value = "";
  document.getElementById("descripcion").value = "";
});

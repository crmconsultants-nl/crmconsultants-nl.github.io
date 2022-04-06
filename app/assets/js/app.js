$().on('load', async e => {
  function api(path, options) {
    return aim.fetch('https://dms.aliconnect.nl/api/v1/crmc'+path).headers({
      Authorization: 'bearer ' + localStorage.getItem('access_token'),
    });
  }
  function signin() {
    $(document.body).text('').append(
      $('form').on('submit', async e => {
        e.preventDefault();
        localStorage.setItem('client_id', e.target.client_id.value);
        try {
          const {access_token} = await api('/signin').post(e.target);
          localStorage.setItem('access_token', access_token);
          location.reload();
        } catch (err) {

        }
      }).append(
        $('div').text('Inlognaam'),
        $('input').name('accountname'),
        $('div').text('Wachtwoord'),
        $('input').name('password').type('password'),
        $('div').text('Client ID'),
        $('input').name('client_id').value(localStorage.getItem('client_id')),
        $('div').append(
          $('button').text('Login'),
        ),
      )
    )
  }
  function start(){
    let searchfunction;
    async function contacten(search) {
      searchfunction = contacten;
      const rows = await api('/contacten').query({
        select: `organisatienaam,achternaam,roepnaam,voornamen,voorletters,tussenvoegsel,organisatieId,contactpersoonId`,
        order: `ISNULL(achternaam,'zzz'),organisatienaam`,
        search: localStorage.getItem('search') || '',
      }).get();
      console.log(rows);
      $('.list').text('').append(
        rows.map(row => $('div').append(
          $('div').append(`${row.roepnaam||row.voornamen||row.voorletters||''} ${row.tussenvoegsel||''} <b>${row.achternaam||''}</b>`),
          $('div').class('organisatienaam').text(row.organisatienaam),
        ).on('click', e => {
          const scrollY = window.scrollY;
          (async function show() {
            const [detail] = await api('/contacten').query({
              select: `*`,
              filter: `organisatieId=${row.organisatieId} AND ISNULL(contactpersoonId,0)=0${row.contactpersoonId||0}`,
            }).get();

            function input(name) {
              return $('input').value(detail[name]).placeholder(aim.displayName(name)).on('change', async e => {
                await api('/contacten').query({
                  filter: `organisatieId=${row.organisatieId} AND ISNULL(contactpersoonId,0)=0${row.contactpersoonId||0}`,
                }).post({
                  [name]: detail[name] = e.target.value,
                });
              });
            }

            const config = {
              contactNames: [
                'Titel',
                'Roepnaam',
                'Voornamen',
                'Voorletters',
                'Tussenvoegsel',
                'Achternaam',
                'TitelNa',
                // 'WeergaveNaam',
              ],
              phoneNames: [
                'MobielZakelijk',
                'MobielPrive',
                'TelefoonOrganisatie',
                'TelefoonZakelijk',
                'TelefoonPrive',
                'FaxOrganisatie',
                'FaxZakelijk',
                'FaxPrive',
              ],
              mailNames: [
                'MailadresZakelijk',
                'MailadresOrganisatie',
                'MailadresFacturatie',
                'MailadresPrive',
              ],
              linkNames: [
                'WebsiteOrganisatie',
                'LinkedIn',
                'Skype',
                'Twitter',
                'Facebook',
                'Instagram',
                'TikTok',
              ],
              adresNames: [
                'Bezoekadres',
                'Postadres',
                'Woonadres',
              ],
              remarkNames: [
                'OpmerkingenContact',
                'OpmerkingenOrganisatie',
              ],
              groupNames: [
                [
                  'KVK_Nummer',
                  'KVK_Omschrijving',
                ],
                [
                  'IBAN',
                  'BIC',
                  'BankNummer',
                  'Bank_Omschrijving',
                  'Swift',
                ],
                [
                  'Debiteur_Nummer',
                  'BTW_Nummer',
                ],
                [
                  'Indicatie_Omzet',
                  'Indicatie_Winst',
                  'Indicatie_Activa',
                ],
              ]
            };
            $('.card').text('').append(
              $('nav').append(
                $('a').class('icn-back').caption('Zoek').on('click', e => {
                  $('.card').text('');
                  window.scrollTo(0,scrollY);
                }),
                $('a').text('Wijzig').style('margin-left:auto;').on('click', e => {
                  $('.card').text('').append(
                    $('nav').append(
                      $('a').text('Gereed').style('margin-left:auto;').on('click', show),
                    ),
                    $('div').class('panel').append(
                      config.contactNames.map(input),
                    ),
                    $('div').class('panel').append(
                      config.phoneNames.map(input),
                    ),
                    $('div').class('panel').append(
                      config.mailNames.map(input),
                    ),
                    $('div').class('panel').append(
                      config.linkNames.map(input),
                    ),
                    $('div').class('panel').append(
                      config.adresNames.map(name => $('div').append(
                        $('label').text(aim.displayName(name)),
                        $('div').append(
                          input(name+'Straat').placeholder('Straat').style('flex-grow: 1;'),
                          input(name+'Nummer').placeholder('Nummer').style('width: 70px;'),
                          input(name+'Toevoeging').placeholder('Toe').style('width: 70px;'),
                        ),
                        $('div').append(
                          input(name+'Postcode').placeholder('Postcode').style('width: 100px;'),
                          input(name+'Plaats').placeholder('Plaats').style('flex-grow: 1;'),
                        ),
                        $('div').append(
                          input(name+'Land').placeholder('Land').style('width: 50%;'),
                          input(name+'Provincie').placeholder('Provincie').style('flex-grow: 1;'),
                        ),
                      )),
                    ),
                    config.groupNames.map(arr => $('div').class('panel').append(
                      arr.map(input),
                    )),
                  );
                  window.scrollTo(0,0);
                }),
              ),
              $('div').style('text-align:center;').append(
                $('div').class('image').append(
                  detail.ContactAfbeeldingBlob
                  ? $('img')
                  .style('border-radius:500px;width:200px;height:200px;object-fit:cover')
                  .src(`data:${detail.ContactAfbeeldingType};base64,${detail.ContactAfbeeldingBlob}`)
                  .on('click', e => {
                    const img = $('img').parent(document.body).src(`data:${detail.ContactAfbeeldingType};base64,${detail.ContactAfbeeldingBlob}`)
                    .style('position:fixed;top:0;right:0;bottom:0;left:0;object-fit:contain;width:100%;height:100%;background-color:rgba(0,0,0,0.5);')
                    .on('click', e => img.remove());
                  })
                  : null,
                ),
                $('div').text(...config.contactNames.map(name => detail[name])),
              ),
              $('div').class('panel').append(
                config.phoneNames.map(name => detail[name] ? $('div').append(
                  $('label').text(aim.displayName(name)),
                  $('div').append($('a').href('tel:'+detail[name]).text(detail[name])),
                ) : null),
              ),
              $('div').class('panel').append(
                config.mailNames.map(name => detail[name] ? $('div').append(
                  $('label').text(aim.displayName(name)),
                  $('div').append($('a').href('mailto:'+detail[name]).text(detail[name])),
                ) : null),
              ),
              $('div').class('panel').append(
                config.linkNames.map(name => detail[name] ? $('div').append(
                  $('label').text(aim.displayName(name)),
                  $('div').append($('a').href(detail[name]).text(detail[name])),
                ) : null),
              ),
              config.adresNames.map(group => $('div').class('panel').append(
                $('div').append(
                  $('a').style('color:inherit;').href(`https://www.google.com/maps/search/?api=1&query=`+[
                    detail[group+'Straat'],
                    detail[group+'Nummer'],
                    detail[group+'Toevoeging'],
                    detail[group+'Postcode'],
                    detail[group+'Plaats'],
                    detail[group+'Land'],
                    detail[group+'Provincie'],
                  ].filter(Boolean).join('+')).append(
                    $('div').text(detail[group+'Straat'], detail[group+'Nummer'], detail[group+'Toevoeging']),
                    $('div').text(detail[group+'Postcode'], detail[group+'Plaats']),
                    $('div').text(detail[group+'Land'], detail[group+'Provincie']),
                  ),
                )
              )),
              config.remarkNames.map(name => $('div').class('panel').append(
                $('div').append(
                  $('label').text(aim.displayName(name)),
                  $('textarea').value(detail[name]),
                ),
              )),
              config.groupNames.map(arr => $('div').class('panel').append(
                arr.map(name => detail[name] ? $('div').append(
                  $('label').text(aim.displayName(name)),
                  $('div').text(detail[name]),
                ) : null),
              )),
            );
            window.scrollTo(0,0);
          })()
        }))
      )
      window.scrollTo(0,0);
    }

    $(document.body).style('height:100%;').text('').append(
      $('div').class('card'),
      $('nav').append(
        // $('button').text('contacten').on('click', e => contacten()),
        $('a').class('icn-back').caption('Login').on('click', e => signin()),
      ),
      $('div').class('search').append(
        $('input').placeholder('Typ hier om te zoeken').value(localStorage.getItem('search')).on('change', e => {
          localStorage.setItem('search', e.target.value);
          searchfunction(e.target.value);
        }),
      ),
      $('div').class('list'),
    );
    contacten();
  }
  if (!localStorage.getItem('access_token')) return signin();
  start();
});
window.addEventListener( 'scroll', e => {
  if (window.scrollYdir != (window.scrollYdir = (window.scrollYdiff = (window.scrollYprev||0) - (window.scrollYprev = window.scrollY)) > 0)) {
    document.querySelector('div.search').style.top = window.scrollYdir ? null : -50 + 'px';
  };
});

const KaKa = () => {

    // Mevcut statları ve verileri al
    const stats = {
        str: {
            racial: document.getElementById('str-racial').innerText,
            total: document.getElementById('str').value,
            modifier: document.getElementById('str-modifier').innerText,
            cost: document.getElementById('str-cost').innerText
        },
        dex: {
            racial: document.getElementById('dex-racial').innerText,
            total: document.getElementById('dex').value,
            modifier: document.getElementById('dex-modifier').innerText,
            cost: document.getElementById('dex-cost').innerText
        },
        con: {
            racial: document.getElementById('con-racial').innerText,
            total: document.getElementById('con').value,
            modifier: document.getElementById('con-modifier').innerText,
            cost: document.getElementById('con-cost').innerText
        },
        int: {
            racial: document.getElementById('int-racial').innerText,
            total: document.getElementById('int').value,
            modifier: document.getElementById('int-modifier').innerText,
            cost: document.getElementById('int-cost').innerText
        },
        wis: {
            racial: document.getElementById('wis-racial').innerText,
            total: document.getElementById('wis').value,
            modifier: document.getElementById('wis-modifier').innerText,
            cost: document.getElementById('wis-cost').innerText
        },
        cha: {
            racial: document.getElementById('cha-racial').innerText,
            total: document.getElementById('cha').value,
            modifier: document.getElementById('cha-modifier').innerText,
            cost: document.getElementById('cha-cost').innerText
        }
    };

    // Yeni bir sekme aç ve HTML içeriğini oluştur
    const newTab = window.open();
    newTab.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Karakter Kağıdı</title>
    <link rel="stylesheet" href="stylesKaKa.css">
</head>
<body> 
    <!-- <div id=""></div> -->
    <div class="container">
        <div id="ust"><div id="ust-isim">
            <div id="isim">Karakter İsmi:<textarea id="noteArea-isim" placeholder="Notlarınızı buraya yazın..."></textarea></div></div>
            <div id="ozellikler">
                <div id="ozellikler-ust">
                    <div id="classLevel">Sınıf/ Level:<textarea id="noteArea-ust" placeholder="Sınıf/ Level"></textarea></div>
                    <div id="background">Karakter Geçmişi:<textarea id="noteArea-ust" placeholder="Karakter Geçmişi"></textarea></div>
                    <div id="PlayerName">Oyuncu İsmi:<textarea id="noteArea-ust" placeholder="Oyuncu İsmi"></textarea></div>
                </div>
                <div id="ozellikler-alt">
                    <div id="race">Irk:<textarea id="noteArea-alt" placeholder="Irk"></textarea></div>
                    <div id="alignment">Alignment:<textarea id="noteArea-alt" placeholder="Alignment"></textarea></div>
                    <div id="EP">Deneyim Puanı:<textarea id="noteArea-alt" placeholder="Deneyim Puanı"></textarea></div>
                </div>
            </div>
        </div>
        <div id="alt">
<!-- ------------------------------------------------------------------------------- -->     
            <div id="sol">
                <div id="sol-ust">
                    <div id="sol-ust-sol">
                        <div id="inspration"><span class="checkbox" id="str-checkbox"></span>          İnspration   </div>
                        <div id="stats">
                            <div id="str">Str <br><br> ${stats.str.modifier} <br><br>${stats.str.total}</div>
                            <div id="dex">Dex <br><br> ${stats.dex.modifier} <br><br>${stats.dex.total}</div>
                            <div id="con">Con <br><br> ${stats.con.modifier} <br><br>${stats.con.total}</div>
                            <div id="int">İnt <br><br> ${stats.int.modifier} <br><br>${stats.int.total}</div>
                            <div id="wis">Wis <br><br> ${stats.wis.modifier} <br><br>${stats.wis.total}</div>
                            <div id="cha">Cha <br><br> ${stats.cha.modifier} <br><br>${stats.cha.total}</div>
                        </div>
                    </div>
                    <div id="sol-ust-sag">
                        <div id="yetenekler">
                            <div id="Proficiency">(+2)       Proficiency Bonus  </div>
                            <div id="kurtarma"><table>
                                <tbody><tr>
                                    <th>Prf</th>
                                    <th>Kurtarma at</th>
                                    <th>Skor</th>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="str-checkbox"></span></td>
                                    <td>Strenght</td>
                                    <td>-1</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="dex-checkbox"></span></td>
                                    <td>Dexterity</td>
                                    <td>-1</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="con-checkbox"></span></td>
                                    <td>Constution</td>
                                    <td>-1</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="int-checkbox"></span></td>
                                    <td>İntelligence</td>
                                    <td>-1</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="wis-checkbox"></span></td>
                                    <td>Wisdom</td>
                                    <td>-1</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="cha-checkbox"></span></td>
                                    <td>Charizma</td>
                                    <td>-1</td>
                                </tr>
                                </tbody></table>
                            </div>
                            <div id="skills">
                                <table>
                                    <tbody>
                                        <tr>
                                            <th>Prf</th>
                                            <th>Skill</th>
                                            <th>Skor</th>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="athletics-checkbox"></span></td>
                                            <td>Athletics</td>
                                            <td><span id="athletics-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="acrobatics-checkbox"></span></td>
                                            <td>Acrobatics</td>
                                            <td><span id="acrobatics-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="sleightOfHand-checkbox"></span></td>
                                            <td>Sleight of Hand</td>
                                            <td><span id="sleightOfHand-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="stealth-checkbox"></span></td>
                                            <td>Stealth</td>
                                            <td><span id="stealth-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="history-checkbox"></span></td>
                                            <td>History</td>
                                            <td><span id="history-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="religion-checkbox"></span></td>
                                            <td>Religion</td>
                                            <td><span id="religion-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="investigation-checkbox"></span></td>
                                            <td>Investigation</td>
                                            <td><span id="investigation-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="nature-checkbox"></span></td>
                                            <td>Nature</td>
                                            <td><span id="nature-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="arcana-checkbox"></span></td>
                                            <td>Arcana</td>
                                            <td><span id="arcana-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="animalHandling-checkbox"></span></td>
                                            <td>Animal Handling</td>
                                            <td><span id="animalHandling-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="insight-checkbox"></span></td>
                                            <td>Insight</td>
                                            <td><span id="insight-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="medicine-checkbox"></span></td>
                                            <td>Medicine</td>
                                            <td><span id="medicine-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="perception-checkbox"></span></td>
                                            <td>Perception</td>
                                            <td><span id="perception-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="survival-checkbox"></span></td>
                                            <td>Survival</td>
                                            <td><span id="survival-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="deception-checkbox"></span></td>
                                            <td>Deception</td>
                                            <td><span id="deception-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="persuasion-checkbox"></span></td>
                                            <td>Persuasion</td>
                                            <td><span id="persuasion-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="performance-checkbox"></span></td>
                                            <td>Performance</td>
                                            <td><span id="performance-bonus">0</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="intimidation-checkbox"></span></td>
                                            <td>Intimidation</td>
                                            <td><span id="intimidation-bonus">0</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div> 
                    </div>
                </div>
                <div id="sol-alt">
                    <div id="PP">(+wisB) Pasive Perception</div>
                    <div id="ozelliklerDiller">Diğer Özellikler ve Diller <hr> 
                        <textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea>
                    </div>
                </div>
            </div>
<!-- ------------------------------------------------------------------------------- -->
            <div id="orta">
                <div id="orta-ust">
                    <div id="orta-ust-ust">
                        <div id="ac">13 <br>AC</div>
                        <div id="iniativ">+dex <br> İniative</div>
                        <div id="speed">30 <br>Speed</div>
                    </div>
                    <div id="orta-ust-orta">
                        <div id="CHitPoint">Max Hit Point= 30 <br>Current Hit Point</div>
                        <div id="THitPoint">+5 <br>Temporary Hit Point</div>
                    </div>
                    <div id="orta-ust-alt">
                        <div id="HitDice">Total= 3d12<br>Hit Dice<br>1d12</div>
                        <div id="DeathSaves">+ + + <br>+ + + <br>Death Saves</div>
                    </div>
                </div>
                <div id="orta-orta">
                <div id="saldırı">
                    <table>
                        <tbody><tr>
                            <th>NAME</th>
                            <th>ATK BONUS</th>
                            <th>DAMAGE/ TYPE</th>
                        </tr>
                        <tr>
                            <td>Strenght</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Dexterity</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Constution</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>İntelligence</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Wisdom</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Charizma</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                    </tbody></table>
                   </div> 
                </div>
                <div id="orta-alt">
                    <div id="para">
                        <table>
                            <tbody><tr>
                                <th>Değer</th>
                                <th>Miktar</th>

                            </tr>
                            <tr>
                                <td>PP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>GP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>SP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>CP</td>
                                <td>10</td>
                            </tr>
                        </tbody></table>
                    </div>
                    <div id="ekipman">Ekipman <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                </div>
            </div>
<!-- ------------------------------------------------------------------------------- -->
            <div id="sag">
                <div id="sag-ust">
                    <div id="kisilik">Kişilik Özellikleri <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="ideals">İdealler <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="bonds">Bond <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="flaws">Flaws <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                </div>
                <div id="sag-alt">FEATURES & TRAITS <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
            </div>
<!-- ------------------------------------------------------------------------------- -->     
        </div>
    
    </div>
    <script src="scriptKaKa.js"></script>
</body>
</html>
    `);
    newTab.document.close();
};
